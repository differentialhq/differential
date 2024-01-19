import { and, eq, sql } from "drizzle-orm";
import { ulid } from "ulid";
import * as cron from "./cron";
import * as data from "./data";
import { writeEvent, writeJobActivity } from "./events";
import {
  ServiceDefinition,
  getServiceDefinitions,
  storeServiceDefinitionBG,
} from "./service-definitions";
import { backgrounded } from "./util";

const createJobStrategies = {
  idempotence: async ({
    service,
    targetFn,
    targetArgs,
    owner,
    pool,
    idempotencyKey,
  }: {
    service: string;
    targetFn: string;
    targetArgs: string;
    owner: { clusterId: string };
    pool?: string;
    idempotencyKey: string;
  }) => {
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
  }: {
    service: string;
    targetFn: string;
    targetArgs: string;
    owner: { clusterId: string };
    pool?: string;
    cacheKey: string;
  }) => {
    const cacheTTL = await getServiceDefinitions(owner)
      .then(
        (defs) =>
          defs
            ?.find((def) => def.name === service)
            ?.functions?.find((fn) => fn.name === targetFn)?.cacheTTL,
      )
      .catch(() => undefined); // on error, just don't cache

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
          sql`resulted_at > now() - interval '${cacheTTL} ms'`,
        ),
      )
      .orderBy(data.jobs.resulted_at, sql`DESC`)
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
    });

    return { id: jobId };
  },
  default: async ({
    service,
    targetFn,
    targetArgs,
    owner,
    pool,
  }: {
    service: string;
    targetFn: string;
    targetArgs: string;
    owner: { clusterId: string };
    pool?: string;
  }) => {
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
    });

    return { id: jobId };
  },
};

const onAfterJobCreated = async ({
  service,
  targetFn,
  targetArgs,
  owner,
  pool,
  idempotencyKey,
  cacheKey,
  jobId,
}: {
  service: string;
  targetFn: string;
  targetArgs: string;
  owner: { clusterId: string };
  pool?: string;
  idempotencyKey?: string;
  cacheKey?: string;
  jobId: string;
}) => {
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

export const createJob = async ({
  service,
  targetFn,
  targetArgs,
  owner,
  pool,
  idempotencyKey,
  cacheKey,
}: {
  service: string;
  targetFn: string;
  targetArgs: string;
  owner: { clusterId: string };
  pool?: string;
  idempotencyKey?: string;
  cacheKey?: string;
}) => {
  // TODO: refactor this
  if (idempotencyKey) {
    const { id } = await createJobStrategies.idempotence({
      service,
      targetFn,
      targetArgs,
      owner,
      pool,
      idempotencyKey,
    });

    onAfterJobCreated({
      service,
      targetFn,
      targetArgs,
      owner,
      pool,
      idempotencyKey,
      jobId: id,
    });

    return { id };
  } else if (cacheKey) {
    const { id } = await createJobStrategies.cached({
      service,
      targetFn,
      targetArgs,
      owner,
      pool,
      cacheKey,
    });

    onAfterJobCreated({
      service,
      targetFn,
      targetArgs,
      owner,
      pool,
      cacheKey,
      jobId: id,
    });

    return { id };
  } else {
    const { id } = await createJobStrategies.default({
      service,
      targetFn,
      targetArgs,
      owner,
      pool,
    });

    onAfterJobCreated({
      service,
      targetFn,
      targetArgs,
      owner,
      pool,
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
    sql`UPDATE jobs SET status = 'running', remaining = remaining - 1 WHERE id IN (SELECT id FROM jobs WHERE (status = 'pending' OR (status = 'failure' AND remaining > 0)) AND owner_hash = ${owner.clusterId} AND service = ${service} LIMIT ${limit}) RETURNING *`,
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
  // TODO: writeJobActivity
  await data.db.execute(
    sql`UPDATE jobs SET status = 'failure' WHERE status = 'running' AND remaining = 0 AND timed_out_at < now()`,
  );

  // TODO: writeJobActivity
  // make jobs that have failed but still have remaining attempts into pending jobs
  await data.db.execute(
    sql`UPDATE jobs SET status = 'pending' WHERE status = 'failure' AND remaining > 0`,
  );
}

export const start = () =>
  cron.registerCron(selfHealJobs, { interval: 1000 * 20 }); // 20 seconds
