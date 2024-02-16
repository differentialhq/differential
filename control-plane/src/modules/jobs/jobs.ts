import { and, eq, inArray, sql } from "drizzle-orm";
import * as cron from "../cron";
import * as data from "../data";
import * as events from "../observability/events";
import {
  ServiceDefinition,
  storeServiceDefinitionBG,
} from "../service-definitions";
import { backgrounded } from "../util";
import { selfHealJobs } from "./persist-result";

export { createJob } from "./create-job";
export { persistJobResult } from "./persist-result";

export const nextJobs = async ({
  service,
  owner,
  limit,
  machineId,
  deploymentId,
  ip,
  definition,
}: {
  service: string;
  owner: { clusterId: string };
  limit: number;
  machineId: string;
  deploymentId?: string;
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

  storeMachineInfoBG(machineId, ip, owner, deploymentId);

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
      deploymentId,
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

export const getJobStatuses = async ({
  jobIds,
  owner,
}: {
  jobIds: string[];
  owner: { clusterId: string };
}) => {
  if (jobIds.length === 0) {
    return [];
  }

  const jobs = await data.db
    .select({
      id: data.jobs.id,
      service: data.jobs.service,
      status: data.jobs.status,
      result: data.jobs.result,
      resultType: data.jobs.result_type,
    })
    .from(data.jobs)
    .where(
      and(
        eq(data.jobs.owner_hash, owner.clusterId),
        inArray(data.jobs.id, jobIds),
      ),
    );

  jobs.forEach((job) => {
    events.write({
      service: job.service,
      clusterId: owner.clusterId,
      jobId: job.id,
      type: "jobStatusRequest",
      meta: {
        status: job.status,
        resultType: job.resultType ?? undefined,
      },
    });
  });

  return jobs;
};

const storeMachineInfoBG = backgrounded(async function storeMachineInfo(
  machineId: string,
  ip: string,
  owner: { clusterId: string },
  deploymentId?: string,
) {
  await data.db
    .insert(data.machines)
    .values({
      id: machineId,
      last_ping_at: new Date(),
      ip,
      cluster_id: owner.clusterId,
      deployment_id: deploymentId,
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

export const start = () =>
  cron.registerCron(selfHealJobs, { interval: 1000 * 5 }); // 5 seconds
