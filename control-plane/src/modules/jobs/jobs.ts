import { and, eq, gt, isNotNull, lt, sql } from "drizzle-orm";
import * as cron from "../cron";
import * as data from "../data";
import * as events from "../observability/events";
import {
  ServiceDefinition,
  storeServiceDefinitionBG,
} from "../service-definitions";
import { backgrounded } from "../util";

export { createJob } from "./create-job";

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
