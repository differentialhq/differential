import { initServer } from "@ts-rest/fastify";
import fs from "fs";
import path from "path";
import util from "util";
import * as admin from "./admin";
import * as auth from "./auth";
import { contract } from "./contract";
import * as data from "./data";
import {
  createDeployment,
  findActiveDeployment,
  getDeployment,
  getDeployments,
  releaseDeployment,
} from "./deployment/deployment";
import { getDeploymentProvider } from "./deployment/deployment-provider";
import * as jobs from "./jobs/jobs";
import * as management from "./management";
import * as eventAggregation from "./observability/event-aggregation";
import * as events from "./observability/events";
import * as routingHelpers from "./routing-helpers";
import { UPLOAD_BUCKET } from "./s3";

const readFile = util.promisify(fs.readFile);

const s = initServer();

export const router = s.router(contract, {
  createJobsRequest: async (request) => {
    const owner = await auth.jobOwnerHash(request.headers.authorization);

    if (!owner) {
      return {
        status: 401,
      };
    }

    const limit = request.body.limit ?? 1;

    let collection: {
      id: string;
      targetFn: string;
      targetArgs: string;
    }[];

    const start = Date.now();

    do {
      collection = await jobs.nextJobs({
        owner,
        limit,
        machineId: request.headers["x-machine-id"],
        deploymentId: request.headers["x-deployment-id"],
        ip: request.request.ip,
        service: request.body.service,
        definition: {
          name: request.body.service,
          functions: request.body.functions,
        },
      });

      if (collection.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } while (collection.length === 0 && Date.now() - start < request.body.ttl);

    return {
      status: 200,
      body: collection,
    };
  },
  persistJobResult: async (request) => {
    const owner = await auth.jobOwnerHash(request.headers.authorization);

    if (!owner) {
      return {
        status: 401,
      };
    }

    const { jobId } = request.params;
    const { result, resultType, functionExecutionTime } = request.body;

    await jobs.persistJobResult({
      result,
      resultType,
      functionExecutionTime,
      jobId,
      owner,
      machineId: request.headers["x-machine-id"] as string,
      deploymentId: request.headers["x-deployment-id"] as string,
    });

    return {
      status: 204,
      body: undefined,
    };
  },
  createJob: async (request) => {
    const owner = await auth.jobOwnerHash(request.headers.authorization);

    if (!owner) {
      return {
        status: 401,
      };
    }

    const { targetFn, targetArgs, pool, service, idempotencyKey, cacheKey } =
      request.body;

    const deployment = await findActiveDeployment(owner.clusterId, service);

    const { id } = await jobs.createJob({
      service,
      targetFn,
      targetArgs,
      owner,
      deploymentId: deployment?.id,
      pool,
      idempotencyKey,
      cacheKey,
    });

    return {
      status: 201,
      body: {
        id,
      },
    };
  },
  getJobStatus: async (request) => {
    const owner = await auth.jobOwnerHash(request.headers.authorization);

    if (!owner) {
      return {
        status: 401,
      };
    }

    const { jobId } = request.params;

    let job: Awaited<ReturnType<typeof jobs.getJobStatus>>;

    const start = Date.now();

    do {
      job = await jobs.getJobStatus({
        jobId,
        owner,
      });

      if (!job) {
        return {
          status: 404,
        };
      }

      if (job.resultType === null) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } while (job.resultType === null && Date.now() - start < request.query.ttl);

    return {
      status: 200,
      body: job,
    };
  },
  live: async () => {
    await data.isAlive();

    return {
      status: 200,
      body: {
        status: "ok",
      },
    };
  },
  getContract: async () => {
    return {
      status: 200,
      body: {
        contract: await readFile(
          path.join(__dirname, "..", "..", "src", "./modules/contract.ts"),
          {
            encoding: "utf-8",
          },
        ),
      },
    };
  },
  // TODO: deprecate
  createCredential: async (request) => {
    if (!auth.machineAuthSuccess(request.headers.authorization)) {
      return {
        status: 401,
      };
    }

    const { organizationId } = request.params;

    const created = await admin.createCredential({
      organizationId,
    });

    return {
      status: 201,
      body: {
        apiSecret: created.apiSecret,
      },
    };
  },
  getTemporaryToken: async () => {
    const created = await admin.createTemporaryCredential();

    return {
      status: 201,
      body: created.apiSecret,
    };
  },
  getClustersForUser: async (request) => {
    const managementToken = request.headers.authorization.split(" ")[1];

    const clusters = await management.getClusters({
      managementToken,
    });

    return {
      status: 200,
      body: clusters,
    };
  },
  createClusterForUser: async (request) => {
    // TODO: Validate token
    const managementToken = request.headers.authorization.split(" ")[1];

    const { description } = request.body;

    await management.createCluster({
      managementToken,
      description,
    });

    return {
      status: 204,
      body: undefined,
    };
  },
  getClusterDetailsForUser: async (request) => {
    const access = await routingHelpers.validateManagementAccess(request);
    if (!access) {
      return {
        status: 401,
      };
    }

    const { clusterId } = request.params;

    const cluster = await management.getClusterDetailsForUser({
      clusterId,
    });

    if (!cluster) {
      return {
        status: 404,
      };
    }

    return {
      status: 200,
      body: cluster,
    };
  },
  getClusterServiceDetailsForUser: async (request) => {
    const access = await routingHelpers.validateManagementAccess(request);
    if (!access) {
      return {
        status: 401,
      };
    }

    const { clusterId, serviceName } = request.params;

    const cluster = await management.getClusterServiceDetailsForUser({
      clusterId,
      serviceName,
      limit: request.query.limit,
    });

    if (!cluster) {
      return {
        status: 404,
      };
    }

    return {
      status: 200,
      body: {
        jobs: cluster.jobs,
        definition: cluster.definition,
      },
    };
  },
  getMetrics: async (request) => {
    const access = await routingHelpers.validateManagementAccess(request);
    if (!access) {
      return {
        status: 401,
      };
    }

    // TODO: Validate serviceName and functionName
    // We don't currently store and service/function names in the database to validate against.
    const { clusterId } = request.params;
    const { serviceName } = request.query;

    const result = await eventAggregation.getFunctionMetrics({
      clusterId,
      service: serviceName,
    });

    return {
      status: 200,
      body: result,
    };
  },
  ingestClientEvents: async (request) => {
    const owner = await auth.jobOwnerHash(request.headers.authorization);

    if (!owner) {
      return {
        status: 401,
      };
    }

    request.body.events.forEach((event) => {
      if (!event.tags) {
        event.tags = {};
      }

      events.write({
        machineId: request.headers["x-machine-id"],
        deploymentId: request.headers["x-deployment-id"],
        clusterId: owner.clusterId,
        type: event.type,
        service: event.tags.service,
        meta: {
          ...event.intFields,
          ...event.tags,
        },
      });
    });

    return {
      status: 204,
      body: undefined,
    };
  },
  getActivity: async (request) => {
    const access = await routingHelpers.validateManagementAccess(request);
    if (!access) {
      return {
        status: 401,
      };
    }

    const { clusterId } = request.params;

    const { jobId } = request.query;

    const result = await eventAggregation.getJobActivityByJobId({
      clusterId,
      jobId,
    });

    return {
      status: 200,
      body: result,
    };
  },
  createDeployment: async (request) => {
    const access = await routingHelpers.validateManagementAccess(request);
    if (!access) {
      return {
        status: 401,
      };
    }

    const { clusterId, serviceName } = request.params;

    if (UPLOAD_BUCKET === undefined) {
      return {
        status: 501,
      };
    }

    const deployment = await createDeployment({
      clusterId,
      serviceName,
    });

    return {
      status: 200,
      body: deployment,
    };
  },
  getDeployment: async (request) => {
    const access = await routingHelpers.validateManagementAccess(request);
    if (!access) {
      return {
        status: 401,
      };
    }

    const { clusterId, deploymentId } = request.params;
    const deployment = await getDeployment(deploymentId);

    if (!deployment || deployment.clusterId !== clusterId) {
      return {
        status: 404,
      };
    }

    return {
      status: 200,
      body: deployment,
    };
  },
  getDeployments: async (request) => {
    const access = await routingHelpers.validateManagementAccess(request);
    if (!access) {
      return {
        status: 401,
      };
    }

    const { clusterId, serviceName } = request.params;
    const deployments = await getDeployments(clusterId, serviceName);

    return {
      status: 200,
      body: deployments,
    };
  },
  releaseDeployment: async (request) => {
    const access = await routingHelpers.validateManagementAccess(request);
    if (!access) {
      return {
        status: 401,
      };
    }

    const { clusterId, deploymentId } = request.params;
    const deployment = await getDeployment(deploymentId);

    if (!deployment || deployment.clusterId !== clusterId) {
      return {
        status: 404,
      };
    }

    if (deployment.status !== "ready") {
      return {
        status: 400,
      };
    }

    return {
      status: 200,
      body: await releaseDeployment(
        deployment,
        getDeploymentProvider(deployment.provider),
      ),
    };
  },
  setClusterSettings: async (request) => {
    const access = await routingHelpers.validateManagementAccess(request);
    if (!access) {
      return {
        status: 401,
      };
    }

    const { clusterId } = request.params;

    const settings = {
      predictiveRetriesEnabled: request.body.predictiveRetriesEnabled,
    };

    await management.setClusterSettings(clusterId, settings);

    return {
      status: 204,
      body: undefined,
    };
  },
  getClusterSettings: async (request) => {
    const access = await routingHelpers.validateManagementAccess(request);
    if (!access) {
      return {
        status: 401,
      };
    }

    const { clusterId } = request.params;

    const settings = await management.getClusterSettings(clusterId);

    return {
      status: 200,
      body: {
        predictiveRetriesEnabled: settings.predictiveRetriesEnabled ?? false,
      },
    };
  },
  getJobStatuses: async (request) => {
    const owner = await auth.jobOwnerHash(request.headers.authorization);

    if (!owner) {
      return {
        status: 401,
      };
    }

    const { jobIds } = request.body;

    const result = await jobs.getJobStatuses({
      jobIds,
      owner,
    });

    return {
      status: 200,
      body: result,
    };
  },
});
