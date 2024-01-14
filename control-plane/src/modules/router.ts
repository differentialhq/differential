import { initServer } from "@ts-rest/fastify";
import { and, eq, sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import util from "util";
import * as admin from "./admin";
import * as auth from "./auth";
import { contract } from "./contract";
import * as data from "./data";
import { createJob, getJobStatus, nextJobs } from "./jobs";
import * as management from "./management";
import * as metrics from "./event-aggregation";
import { writeEvent } from "./events";
import * as serviceDefinitions from "./service-definitions";
import * as routingHelpers from "./routing-helpers";

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

    let jobs: {
      id: string;
      targetFn: string;
      targetArgs: string;
    }[];

    const start = Date.now();

    do {
      jobs = await nextJobs({
        owner,
        limit,
        machineId: request.headers["x-machine-id"],
        ip: request.request.ip,
        service: request.body.service,
        definition: {
          name: request.body.service,
          functions: request.body.functions,
        },
      });

      if (jobs.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } while (jobs.length === 0 && Date.now() - start < request.body.ttl);

    return {
      status: 200,
      body: jobs,
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

    const updateResult = await data.db
      .update(data.jobs)
      .set({
        result,
        result_type: resultType,
        resulted_at: sql`now()`,
        function_execution_time_ms: functionExecutionTime,
        status: "success",
      })
      .where(
        and(eq(data.jobs.id, jobId), eq(data.jobs.owner_hash, owner.clusterId))
      )
      .returning({ service: data.jobs.service, function: data.jobs.target_fn });

    writeEvent({
      type: "jobResulted",
      tags: {
        clusterId: owner.clusterId,
        service: updateResult[0]?.service,
        function: updateResult[0]?.function,
        resultType,
      },
      intFields: {
        ...(functionExecutionTime !== undefined ? { functionExecutionTime } : {}),
      },
      stringFields: {
        jobId,
      },
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

    const { targetFn, targetArgs, pool, service, idempotencyKey } =
      request.body;

    const { id } = await createJob({
      service: service || null,
      targetFn,
      targetArgs,
      owner,
      pool,
      idempotencyKey,
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

    let job: Awaited<ReturnType<typeof getJobStatus>>;

    const start = Date.now();

    do {
      job = await getJobStatus({
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
          }
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
    await routingHelpers.validateManagementAccess(request);

    const managementToken = request.headers.authorization.split(" ")[1];

    const { clusterId } = request.params;

    const cluster = await management.getClusterDetailsForUser({
      managementToken,
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
  getFunctionMetrics: async (request) => {
    await routingHelpers.validateManagementAccess(request);

    // TODO: Validate serviceName and functionName
    // We don't currently store and service/function names in the database to validate against.
    const { clusterId, serviceName, functionName } = request.params;

    // Default to last 24 hours
    const start = request.query.start ?? new Date(Date.now() - 86400000);
    const stop = request.query.stop ?? new Date();

    const result = await metrics.getFunctionMetrics(
      clusterId,
      serviceName,
      functionName,
      start,
      stop
    );

    return {
      status: 200,
      body: {
        start: start,
        stop: stop,
        ...result
      },
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
        event.tags = {}
      }

      event.tags.machineId = request.headers["x-machine-id"]
      event.tags.clusterId = owner.clusterId
      writeEvent(event)
    })

    return {
      status: 204,
      body: undefined,
    };
  },
});
