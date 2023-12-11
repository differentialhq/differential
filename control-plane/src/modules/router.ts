import { initServer } from "@ts-rest/fastify";
import crypto from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { ulid } from "ulid";
import { contract } from "./contract";
import * as data from "./data";
import fs from "fs";
import util from "util";
import path from "path";
import * as auth from "./auth";
import * as admin from "./admin";
import { QueryResult } from "pg";
import { nextJobs } from "./jobs";

const readFile = util.promisify(fs.readFile);

const s = initServer();

export const router = s.router(contract, {
  getNextJobs: async (request) => {
    const owner = await auth.jobOwnerHash(request.headers.authorization);

    if (!owner) {
      return {
        status: 401,
      };
    }

    const limit = request.query.limit ?? 1;

    const pool = request.query.pools || "*";

    await selfHealJobsHack();

    const jobs = await nextJobs({
      functions: request.query.functions,
      pools: pool,
      owner,
      limit,
      machineId: request.headers["x-machine-id"],
      ip: request.request.ip,
    });

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
    const { result, resultType } = request.body;

    await data.db
      .update(data.jobs)
      .set({
        result,
        result_type: resultType,
        status: "success",
      })
      .where(
        and(eq(data.jobs.id, jobId), eq(data.jobs.owner_hash, owner.clusterId))
      );

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

    const { targetFn, targetArgs, pool } = request.body;

    const id = `exec-${ulid()}`;

    console.log("Creating job", {
      id,
      target_fn: targetFn,
      target_args: targetArgs,
      idempotency_key: `1`,
      status: "pending",
      pool,
    });

    await data.db.insert(data.jobs).values({
      id,
      target_fn: targetFn,
      target_args: targetArgs,
      idempotency_key: `ik_${crypto.randomBytes(64).toString("hex")}`,
      status: "pending",
      owner_hash: owner.clusterId,
      machine_type: pool,
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

    const [job] = await data.db
      .select({
        status: data.jobs.status,
        result: data.jobs.result,
        resultType: data.jobs.result_type,
      })
      .from(data.jobs)
      .where(
        and(eq(data.jobs.id, jobId), eq(data.jobs.owner_hash, owner.clusterId))
      );

    if (!job) {
      return {
        status: 404,
      };
    }

    return {
      status: 200,
      body: job,
    };
  },
  live: async () => {
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
  getClusters: async (request) => {
    if (!auth.machineAuthSuccess(request.headers.authorization)) {
      return {
        status: 401,
      };
    }

    const { organizationId } = request.params;

    const clusters = await admin.getClusters({
      organizationId,
    });

    return {
      status: 200,
      body: clusters,
    };
  },
  getClusterDetails: async (request) => {
    if (!auth.machineAuthSuccess(request.headers.authorization)) {
      return {
        status: 401,
      };
    }

    const { clusterId } = request.params;

    const cluster = await admin.getClusterDetails({
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
  getTemporaryToken: async () => {
    const created = await admin.createTemporaryCredential();

    return {
      status: 201,
      body: created.apiSecret,
    };
  },
});
async function selfHealJobsHack() {
  await data.db.execute(
    sql`UPDATE jobs SET status = 'failure' WHERE status = 'running' AND remaining = 0 AND timed_out_at < now()`
  );

  // make jobs that have failed but still have remaining attempts into pending jobs
  await data.db.execute(
    sql`UPDATE jobs SET status = 'pending' WHERE status = 'failure' AND remaining > 0`
  );
}
