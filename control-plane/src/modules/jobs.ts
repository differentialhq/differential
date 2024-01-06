import { and, eq, sql } from "drizzle-orm";
import { ulid } from "ulid";
import * as cron from "./cron";
import * as data from "./data";

export const createJob = async ({
  service,
  targetFn,
  targetArgs,
  owner,
  pool,
  idempotencyKey,
}: {
  service: string | null;
  targetFn: string;
  targetArgs: string;
  owner: { clusterId: string };
  pool?: string;
  idempotencyKey?: string;
}) => {
  const jobId = idempotencyKey ?? ulid();

  await data.db
    .insert(data.jobs)
    .values({
      id: jobId,
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
};

export const nextJobs = async ({
  service,
  owner,
  limit,
  machineId,
  ip,
}: {
  service: string | null;
  owner: { clusterId: string };
  limit: number;
  machineId: string;
  ip: string;
}) => {
  const results = await data.db.execute(
    sql`UPDATE jobs SET status = 'running', remaining = remaining - 1 WHERE id IN (SELECT id FROM jobs WHERE (status = 'pending' OR (status = 'failure' AND remaining > 0)) AND owner_hash = ${owner.clusterId} AND service = ${service} LIMIT ${limit}) RETURNING *`
  );

  // store machine info. needs to be backgrounded later
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
        cluster_id: owner.clusterId,
      },
    });

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
      status: data.jobs.status,
      result: data.jobs.result,
      resultType: data.jobs.result_type,
    })
    .from(data.jobs)
    .where(
      and(eq(data.jobs.id, jobId), eq(data.jobs.owner_hash, owner.clusterId))
    );

  return job;
};

export async function selfHealJobs() {
  await data.db.execute(
    sql`UPDATE jobs SET status = 'failure' WHERE status = 'running' AND remaining = 0 AND timed_out_at < now()`
  );

  // make jobs that have failed but still have remaining attempts into pending jobs
  await data.db.execute(
    sql`UPDATE jobs SET status = 'pending' WHERE status = 'failure' AND remaining > 0`
  );
}

cron.registerCron(selfHealJobs, { interval: 1000 * 20 }); // 20 seconds
