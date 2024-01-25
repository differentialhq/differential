import { and, desc, eq, gt, gte, isNotNull, lt, sql } from "drizzle-orm";
import { ulid } from "ulid";
import * as cron from "./cron";
import * as data from "./data";
import { writeEvent, writeJobActivity } from "./events";
import {
  ServiceDefinition,
  getServiceDefinitionProperty,
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
    const cacheTTL = await getServiceDefinitionProperty(
      owner,
      service,
      targetFn,
      "cacheTTL",
    )
      .then((ttl) => ttl ?? 0)
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
  writeEvent({
    type: "jobCreated",
    tags: {
      clusterId: owner.clusterId,
      service: service,
      function: targetFn,
    },
    stringFields: {
      jobId: jobId,
    },
  });

  writeJobActivity({
    service,
    clusterId: owner.clusterId,
    jobId,
    type: "RECEIVED_BY_CONTROL_PLANE",
    meta: {
      targetFn,
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
  maxAttempts?: number;
  timeoutIntervalSeconds?: number;
}) => {
  if (params.idempotencyKey) {
    const idempotencyParams = {
      ...params,
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
      cacheKey: params.cacheKey,
    });

    onAfterJobCreated({
      ...params,
      jobId: id,
    });

    return { id };
  } else {
    const { id } = await createJobStrategies.default(params);

    onAfterJobCreated({
      ...params,
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
  writeEvent({
    type: "machinePing",
    tags: {
      clusterId: owner.clusterId,
      machineId,
      ip,
    },
  });

  const results = await data.db.execute(
    sql`UPDATE jobs SET status = 'running', remaining = remaining - 1, last_retrieved_at=${new Date().toISOString()} 
    WHERE 
      id IN (SELECT id FROM jobs WHERE (status = 'pending' OR (status = 'failure' AND remaining > 0)) 
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
    writeJobActivity({
      service,
      clusterId: owner.clusterId,
      jobId: job.id,
      type: "RECEIVED_BY_MACHINE",
      meta: {
        targetFn: job.targetFn,
        targetArgs: job.targetArgs,
      },
      machineId,
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
    writeJobActivity({
      service: job.service,
      clusterId: owner.clusterId,
      jobId,
      type: "JOB_STATUS_REQUESTED",
      meta: {
        status: job.status,
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
  functionExecutionTime: number | undefined;
  jobId: string;
  owner: { organizationId: string | null; clusterId: string };
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

  writeJobActivity({
    service: updateResult[0]?.service,
    clusterId: owner.clusterId,
    jobId,
    type: "RESULT_SENT_TO_CONTROL_PLANE",
    machineId,
    meta: {
      targetFn: updateResult[0]?.function,
      resultType,
      result,
    },
  });
}

export async function selfHealJobs() {
  // TODO: impose a global timeout on jobs that don't have a timeout set

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
  const failed = await data.db
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
    writeJobActivity({
      service: row.service,
      clusterId: row.ownerHash,
      jobId: row.id,
      type: "JOB_TIMED_OUT",
      meta: {
        attemptsRemaining: row.remainingAttempts,
      },
    });
  });

  failed.forEach((row) => {
    writeJobActivity({
      service: row.service,
      clusterId: row.ownerHash,
      jobId: row.id,
      type: "JOB_FAILED",
    });
  });
}

export const start = () =>
  cron.registerCron(selfHealJobs, { interval: 1000 * 20 }); // 20 seconds
