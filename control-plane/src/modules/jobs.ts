import { and, desc, eq, gt, gte, isNotNull, lt, sql } from "drizzle-orm";
import { ulid } from "ulid";
import * as cluster from "./cluster";
import * as cron from "./cron";
import * as data from "./data";
import * as events from "./observability/events";
import * as predictor from "./predictor/predictor";
import {
  ServiceDefinition,
  functionDefinition,
  storeServiceDefinitionBG,
} from "./service-definitions";
import { backgrounded } from "./util";

type JobParams = {
  service: string;
  targetFn: string;
  targetArgs: string;
  owner: { clusterId: string };
  pool?: string;
  timeoutIntervalSeconds?: number;
  maxAttempts?: number;
};

const createJobStrategies = {
  idempotence: async ({
    service,
    targetFn,
    targetArgs,
    owner,
    pool,
    idempotencyKey,
    timeoutIntervalSeconds,
    maxAttempts,
  }: JobParams & { idempotencyKey: string }) => {
    const jobId = idempotencyKey;

    await data.db
      .insert(data.jobs)
      .values({
        id: idempotencyKey,
        target_fn: targetFn,
        target_args: targetArgs,
        idempotency_key: jobId,
        status: "pending",
        owner_hash: owner.clusterId,
        machine_type: pool,
        service,
        remaining_attempts: maxAttempts ?? 1,
        timeout_interval_seconds: timeoutIntervalSeconds,
      })
      .onConflictDoNothing();

    return { id: jobId };
  },
  cached: async ({
    service,
    targetFn,
    targetArgs,
    owner,
    pool,
    cacheKey,
    timeoutIntervalSeconds,
    maxAttempts,
  }: JobParams & { cacheKey: string }) => {
    const cacheTTL = await functionDefinition(owner, service, targetFn)
      .then((d) => d?.cacheTTL ?? 0)
      .catch(() => 0); // on error, just don't cache

    // has a job been completed within the TTL?
    // if so, return the jobId

    const [job] = await data.db
      .select({
        id: data.jobs.id,
      })
      .from(data.jobs)
      .where(
        and(
          eq(data.jobs.cache_key, cacheKey),
          eq(data.jobs.owner_hash, owner.clusterId),
          eq(data.jobs.service, service),
          eq(data.jobs.target_fn, targetFn),
          eq(data.jobs.status, "success"),
          eq(data.jobs.result_type, "resolution"),
          gte(data.jobs.resulted_at, new Date(Date.now() - cacheTTL)),
        ),
      )
      .orderBy(desc(data.jobs.resulted_at))
      .limit(1);

    if (job) {
      return { id: job.id };
    }

    // if not, create a job
    const jobId = ulid();

    await data.db.insert(data.jobs).values({
      id: jobId,
      target_fn: targetFn,
      target_args: targetArgs,
      idempotency_key: jobId,
      status: "pending",
      owner_hash: owner.clusterId,
      machine_type: pool,
      service,
      cache_key: cacheKey,
      remaining_attempts: maxAttempts ?? 1,
      timeout_interval_seconds: timeoutIntervalSeconds,
    });

    return { id: jobId };
  },
  default: async ({
    service,
    targetFn,
    targetArgs,
    owner,
    pool,
    timeoutIntervalSeconds,
    maxAttempts,
  }: JobParams) => {
    const jobId = ulid();

    await data.db.insert(data.jobs).values({
      id: jobId,
      target_fn: targetFn,
      target_args: targetArgs,
      idempotency_key: jobId,
      status: "pending",
      owner_hash: owner.clusterId,
      machine_type: pool,
      service,
      remaining_attempts: maxAttempts ?? 1,
      timeout_interval_seconds: timeoutIntervalSeconds,
    });

    return { id: jobId };
  },
};

const onAfterJobCreated = async ({
  service,
  targetFn,
  targetArgs,
  owner,
  jobId,
}: JobParams & { jobId: string }) => {
  events.write({
    type: "jobCreated",
    clusterId: owner.clusterId,
    jobId,
    meta: {
      targetFn,
      service,
      targetArgs,
    },
  });
};

export const createJob = async (params: {
  service: string;
  targetFn: string;
  targetArgs: string;
  owner: { clusterId: string };
  pool?: string;
  idempotencyKey?: string;
  cacheKey?: string;
}) => {
  const serviceDefinition = await functionDefinition(
    params.owner,
    params.service,
    params.targetFn,
  );

  const retryParams = {
    timeoutIntervalSeconds: serviceDefinition?.timeoutIntervalSeconds,
    maxAttempts: serviceDefinition?.maxAttempts,
  };

  if (params.idempotencyKey) {
    const idempotencyParams = {
      ...params,
      ...retryParams,
      idempotencyKey: params.idempotencyKey,
    };

    const { id } = await createJobStrategies.idempotence({
      ...idempotencyParams,
      idempotencyKey: params.idempotencyKey,
    });

    onAfterJobCreated({
      ...idempotencyParams,
      jobId: id,
    });

    return { id };
  } else if (params.cacheKey) {
    const { id } = await createJobStrategies.cached({
      ...params,
      ...retryParams,
      cacheKey: params.cacheKey,
    });

    onAfterJobCreated({
      ...params,
      jobId: id,
    });

    return { id };
  } else {
    const { id } = await createJobStrategies.default({
      ...params,
      ...retryParams,
    });

    onAfterJobCreated({
      ...params,
      ...retryParams,
      jobId: id,
    });

    return { id };
  }
};

export const nextJobs = async ({
  service,
  owner,
  limit,
  machineId,
  ip,
  definition,
}: {
  service: string;
  owner: { clusterId: string };
  limit: number;
  machineId: string;
  ip: string;
  definition?: ServiceDefinition;
}) => {
  // events.write({
  //   type: "machinePing",
  //   clusterId: owner.clusterId,
  //   machineId,
  //   service,
  //   meta: {
  //     ip,
  //     limit,
  //   },
  // });

  const results = await data.db.execute(
    sql`UPDATE jobs SET status = 'running', remaining_attempts = remaining_attempts - 1, last_retrieved_at=${new Date().toISOString()} 
    WHERE 
      id IN (SELECT id FROM jobs WHERE (status = 'pending' OR (status = 'failure' AND remaining_attempts > 0)) 
      AND owner_hash = ${owner.clusterId} 
      AND service = ${service} 
    LIMIT ${limit}) 
    RETURNING *`,
  );

  storeMachineInfoBG(machineId, ip, owner);

  if (definition) {
    storeServiceDefinitionBG(service, definition, owner);
  }

  if (results.rowCount === 0) {
    return [];
  }

  const jobs: {
    id: string;
    targetFn: string;
    targetArgs: string;
  }[] = results.rows.map((row) => ({
    id: row.id as string,
    targetFn: row.target_fn as string,
    targetArgs: row.target_args as string,
  }));

  jobs.forEach((job) => {
    events.write({
      service,
      clusterId: owner.clusterId,
      jobId: job.id,
      type: "jobReceived",
      machineId,
      meta: {
        targetFn: job.targetFn,
        targetArgs: job.targetArgs,
      },
    });
  });

  return jobs;
};

export const getJobStatus = async ({
  jobId,
  owner,
}: {
  jobId: string;
  owner: { clusterId: string };
}) => {
  const [job] = await data.db
    .select({
      service: data.jobs.service,
      status: data.jobs.status,
      result: data.jobs.result,
      resultType: data.jobs.result_type,
    })
    .from(data.jobs)
    .where(
      and(eq(data.jobs.id, jobId), eq(data.jobs.owner_hash, owner.clusterId)),
    );

  if (job) {
    events.write({
      service: job.service,
      clusterId: owner.clusterId,
      jobId,
      type: "jobStatusRequest",
      meta: {
        status: job.status,
        resultType: job.resultType ?? undefined,
      },
    });
  }

  return job;
};

const storeMachineInfoBG = backgrounded(async function storeMachineInfo(
  machineId: string,
  ip: string,
  owner: { clusterId: string },
) {
  await data.db
    .insert(data.machines)
    .values({
      id: machineId,
      last_ping_at: new Date(),
      ip,
      cluster_id: owner.clusterId,
    })
    .onConflictDoUpdate({
      target: data.machines.id,
      set: {
        last_ping_at: new Date(),
        ip,
      },
      where: eq(data.machines.cluster_id, owner.clusterId),
    });
});

export async function persistJobResult({
  result,
  resultType,
  functionExecutionTime,
  jobId,
  owner,
  machineId,
}: {
  result: string;
  resultType: "resolution" | "rejection";
  functionExecutionTime?: number;
  jobId: string;
  owner: { clusterId: string };
  machineId: string;
}) {
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
      and(eq(data.jobs.id, jobId), eq(data.jobs.owner_hash, owner.clusterId)),
    )
    .returning({ service: data.jobs.service, targetFn: data.jobs.target_fn });

  events.write({
    type: "jobResulted",
    service: updateResult[0]?.service,
    clusterId: owner.clusterId,
    jobId,
    machineId,
    meta: {
      targetFn: updateResult[0]?.targetFn,
      result,
      resultType,
      functionExecutionTime,
    },
  });

  const mustRetry =
    resultType === "rejection" &&
    (await cluster
      .operationalCluster(owner.clusterId)
      .then((c) => c?.predictiveRetriesEnabled));

  console.log("mustRetry", mustRetry);
  console.log("resultType", resultType);

  if (mustRetry) {
    const [job] = await data.db
      .select({
        remainingAttempts: data.jobs.remaining_attempts,
      })
      .from(data.jobs)
      .where(
        and(eq(data.jobs.id, jobId), eq(data.jobs.owner_hash, owner.clusterId)),
      );

    if ((job.remainingAttempts ?? 0) > 0) {
      const retryable = await predictor.isRetryable(result);

      console.log("retryable", retryable);

      if (retryable.retryable) {
        events.write({
          type: "predictorRetryableResult",
          service: updateResult[0]?.service,
          clusterId: owner.clusterId,
          jobId,
          machineId,
          meta: {
            retryable: true,
            reason: retryable.reason,
          },
        });

        // mark them as pending again with attempts - 1
        await data.db
          .update(data.jobs)
          .set({
            status: "pending",
            remaining_attempts: sql`remaining_attempts - 1`,
          })
          .where(
            and(
              eq(data.jobs.id, jobId),
              eq(data.jobs.owner_hash, owner.clusterId),
            ),
          );
      } else {
        events.write({
          type: "predictorRetryableResult",
          service: updateResult[0]?.service,
          clusterId: owner.clusterId,
          jobId,
          machineId,
          meta: {
            retryable: false,
            reason: retryable.reason,
          },
        });
      }
    }
  }
}

export async function selfHealJobs() {
  // TODO: impose a global timeout on jobs that don't have a timeout set
  // TODO: these queries need to be chunked. If there are 100k jobs, we don't want to update them all at once

  // Jobs are failed if they are running and have timed out
  const stalled = await data.db
    .update(data.jobs)
    .set({
      status: "failure",
    })
    .where(
      and(
        eq(data.jobs.status, "running"),
        lt(
          data.jobs.last_retrieved_at,
          sql`now() - interval '1 second' * timeout_interval_seconds`,
        ),
        isNotNull(data.jobs.timeout_interval_seconds), // only timeout jobs that have a timeout set
      ),
    )
    .returning({
      id: data.jobs.id,
      service: data.jobs.service,
      targetFn: data.jobs.target_fn,
      ownerHash: data.jobs.owner_hash,
      remainingAttempts: data.jobs.remaining_attempts,
    });

  // If jobs have failed, but they have remaining attempts, make them pending again
  const recovered = await data.db
    .update(data.jobs)
    .set({
      status: "pending",
    })
    .where(
      and(eq(data.jobs.status, "failure"), gt(data.jobs.remaining_attempts, 0)),
    )
    .returning({
      id: data.jobs.id,
      service: data.jobs.service,
      targetFn: data.jobs.target_fn,
      ownerHash: data.jobs.owner_hash,
      remainingAttempts: data.jobs.remaining_attempts,
    });

  stalled.forEach((row) => {
    events.write({
      service: row.service,
      clusterId: row.ownerHash,
      jobId: row.id,
      type: "jobStalled",
      meta: {
        attemptsRemaining: row.remainingAttempts ?? undefined,
      },
    });
  });

  recovered.forEach((row) => {
    events.write({
      service: row.service,
      clusterId: row.ownerHash,
      jobId: row.id,
      type: "jobRecovered",
    });
  });

  return {
    stalled: stalled.map((row) => row.id),
    recovered: recovered.map((row) => row.id),
  };
}

export const start = () =>
  cron.registerCron(selfHealJobs, { interval: 1000 * 20 }); // 20 seconds
