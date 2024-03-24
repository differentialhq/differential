import { initServer } from "@ts-rest/fastify";
import fs from "fs";
import path from "path";
import util from "util";
import * as admin from "./admin";
import { createAssetUploadWithTarget } from "./assets";
import * as auth from "./auth";
import { operationalCluster } from "./cluster";
import { contract } from "./contract";
import * as data from "./data";
import {
  createDeployment,
  findActiveDeployment,
  getDeployment,
  getDeployments,
  releaseDeployment,
  updateDeploymentResult,
} from "./deployment/deployment";
import { getDeploymentProvider } from "./deployment/deployment-provider";
import * as jobs from "./jobs/jobs";
import * as management from "./management";
import * as eventAggregation from "./observability/event-aggregation";
import * as events from "./observability/events";
import * as clientLib from "./packages/client-lib";
import * as routingHelpers from "./routing-helpers";
import { getObject } from "./s3";
import {
  confirmSubscription,
  parseCloudFormationMessage,
  validateSignature,
} from "./sns";
import { deploymentResultFromNotification } from "./deployment/cfn-manager";
import { env } from "../utilities/env";
import { logger } from "../utilities/logger";

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

    const { targetFn, targetArgs, pool, service, cacheKey } = request.body;

    const deployment = owner.cloudEnabled
      ? await findActiveDeployment(owner.clusterId, service)
      : null;

    const { id } = await jobs.createJob({
      service,
      targetFn,
      targetArgs,
      owner,
      deploymentId: deployment?.id,
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
    const access = await routingHelpers.validateManagementRequest(request);
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
    const access = await routingHelpers.validateManagementRequest(request);
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
    const access = await routingHelpers.validateManagementRequest(request);
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
    const access = await routingHelpers.validateManagementRequest(request);
    if (!access) {
      return {
        status: 401,
      };
    }

    const { clusterId } = request.params;

    const { jobId, deploymentId } = request.query;

    const result = await eventAggregation.getJobActivityByJobId({
      clusterId,
      jobId,
      deploymentId,
    });

    return {
      status: 200,
      body: result,
    };
  },
  createDeployment: async (request) => {
    if (!env.CLOUD_FEATURES_AVAILABLE) {
      logger.warn(
        "Received deployment request but cloud features are not available",
      );
      return {
        status: 501,
      };
    }

    const access = await routingHelpers.validateManagementRequest(request);
    const { cloudEnabled } = await operationalCluster(request.params.clusterId);
    if (!access || !cloudEnabled) {
      return {
        status: 401,
      };
    }

    const { clusterId, serviceName } = request.params;

    const deployment = await createDeployment({
      clusterId,
      serviceName,
    });

    return {
      status: 201,
      body: deployment,
    };
  },
  getDeployment: async (request) => {
    const access = await routingHelpers.validateManagementRequest(request);
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
    const access = await routingHelpers.validateManagementRequest(request);
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
    const access = await routingHelpers.validateManagementRequest(request);
    const { cloudEnabled } = await operationalCluster(request.params.clusterId);
    if (!access || !cloudEnabled) {
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
      body: await releaseDeployment(
        deployment,
        getDeploymentProvider(deployment.provider),
      ),
    };
  },
  setClusterSettings: async (request) => {
    const access = await routingHelpers.validateManagementRequest(request);
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
    const access = await routingHelpers.validateManagementRequest(request);
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
        cloudEnabled: settings.cloudEnabled ?? false,
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
  createClientLibraryVersion: async (request) => {
    if (!env.CLOUD_FEATURES_AVAILABLE) {
      logger.warn(
        "Received client library request but cloud features are not available",
      );
      return {
        status: 501,
      };
    }

    const access = await routingHelpers.validateManagementRequest(request);
    const { cloudEnabled } = await operationalCluster(request.params.clusterId);
    if (!access || !cloudEnabled) {
      return {
        status: 401,
      };
    }

    const { clusterId } = request.params;
    const { increment } = request.body;

    const newVersion = await clientLib.createClientLibraryVersion({
      clusterId,
      increment,
    });

    return {
      status: 201,
      body: newVersion,
    };
  },
  getClientLibraryVersions: async (request) => {
    const access = await routingHelpers.validateManagementRequest(request);
    if (!access) {
      return {
        status: 401,
      };
    }

    const { clusterId } = request.params;

    const clients = await clientLib.getClientLibraryVersions({
      clusterId,
    });

    return {
      status: 200,
      body: clients,
    };
  },
  createAsset: async (request) => {
    const access = await routingHelpers.validateManagementRequest(request);
    if (!access) {
      return {
        status: 401,
      };
    }

    const { clusterId } = request.params;
    const { type, target } = request.body;

    try {
      const presignedUrl = await createAssetUploadWithTarget({
        target,
        clusterId,
        type,
      });
      if (!presignedUrl) {
        return {
          status: 400,
        };
      }
      return {
        status: 201,
        body: {
          presignedUrl: presignedUrl,
        },
      };
    } catch (e) {
      logger.error("Failed to create asset", {
        error: e,
      });
      return {
        status: 400,
      };
    }
  },
  npmRegistryDefinition: async (request) => {
    if (!env.CLOUD_FEATURES_AVAILABLE) {
      logger.warn(
        "Received NPM registry request but cloud features are not available",
      );
      return {
        status: 501,
      };
    }

    const fullPackageName = request.params.packageName;
    const encodedPackageName = encodeURIComponent(fullPackageName);

    const [_scope, clusterId] = fullPackageName.split("/");

    const access = await routingHelpers.validateManagementAccess({
      authorization: request.headers.authorization,
      clusterId: clusterId,
    });
    if (!access) {
      return {
        status: 401,
      };
    }

    const versions = await clientLib.getClientLibraryVersions({
      clusterId: clusterId,
    });

    if (versions.length === 0) {
      return {
        status: 404,
      };
    }

    const renderedVersions = versions.reduce(
      (acc, v) => {
        acc[v.version] = {
          name: fullPackageName,
          version: v.version,
          dist: {
            tarball: `http://${request.headers.host}/packages/npm/${encodedPackageName}/${v.version}`,
          },
        };
        return acc;
      },
      {} as Record<string, any>,
    );

    return {
      status: 200,
      body: {
        "dist-tags": {
          latest: versions[0].version,
        },
        description: `Client library Differential cluster: ${clusterId}`,
        name: fullPackageName,
        versions: renderedVersions,
      },
    };
  },
  npmRegistryDownload: async (request) => {
    const [_scope, clusterId] = request.params.packageName.split("/");
    const version = request.params.version;

    const access = await routingHelpers.validateManagementAccess({
      authorization: request.headers.authorization,
      clusterId: clusterId,
    });

    if (!access) {
      return {
        status: 401,
      };
    }

    const library = await clientLib.getClientLibraryVersion({
      clusterId: clusterId,
      version,
    });

    if (!library) {
      return {
        status: 404,
      };
    }

    return {
      status: 200,
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${clusterId}-${version}.tgz"`,
      },
      body: await getObject(library),
    };
  },
  sns: async (request) => {
    if (!env.CLOUD_FEATURES_AVAILABLE) {
      logger.warn("Received SNS request but cloud features are not available");
      return {
        status: 501,
      };
    }

    try {
      await validateSignature(request.request.body as Record<string, unknown>);
    } catch {
      logger.error("SNS Signature validation failed");
      return {
        status: 400,
      };
    }

    if (request.body.TopicArn != env.DEPLOYMENT_SNS_TOPIC) {
      logger.warn("Received request for unknown SNS topic");
      return {
        status: 400,
      };
    }

    if (request.body.Type == "SubscriptionConfirmation" && request.body.Token) {
      await confirmSubscription({
        Token: request.body.Token,
        TopicArn: env.DEPLOYMENT_SNS_TOPIC,
      });
      logger.info("Confirmed SNS subscription", {
        TopicArn: env.DEPLOYMENT_SNS_TOPIC,
      });
    }

    if (
      request.body.Type == "Notification" &&
      request.body.Subject == "AWS CloudFormation Notification" &&
      request.body.Message
    ) {
      const message = parseCloudFormationMessage(request.body.Message);
      const result = deploymentResultFromNotification(message);

      logger.info("Received deployment result from CloudFormation", {
        result,
      });

      const status = result.pending
        ? "uploading"
        : result.success
          ? "active"
          : "failed";
      await updateDeploymentResult(
        { id: result.clientRequestToken },
        status,
        result,
      );
    }

    return {
      status: 200,
      body: undefined,
    };
  },
});
