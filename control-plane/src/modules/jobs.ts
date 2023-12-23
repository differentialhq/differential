import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { QueryResult } from "pg";
import * as data from "./data";
import { ulid } from "ulid";
import crypto from "crypto";

export async function selfHealJobsHack() {
  await data.db.execute(
    sql`UPDATE jobs SET status = 'failure' WHERE status = 'running' AND remaining = 0 AND timed_out_at < now()`
  );

  // make jobs that have failed but still have remaining attempts into pending jobs
  await data.db.execute(
    sql`UPDATE jobs SET status = 'pending' WHERE status = 'failure' AND remaining > 0`
  );
}

export const putJobResult = async ({
  jobId,
  result,
  resultType,
  clusterId,
  cacheTTL,
}: {
  jobId: string;
  result: string;
  resultType: "resolution" | "rejection";
  clusterId: string;
  cacheTTL?: number;
}) => {
  await data.db
    .update(data.jobs)
    .set({
      result,
      result_type: resultType,
      status: "success",
      // add the cacheTTL seconds to the current time
      cache_expiry_at: cacheTTL
        ? new Date(new Date().getTime() + (cacheTTL || 0) * 1000)
        : undefined,
    })
    .where(and(eq(data.jobs.id, jobId), eq(data.jobs.owner_hash, clusterId)));
};

export const createJob = async ({
  targetFn,
  targetArgs,
  owner,
  service,
}: {
  targetFn: string;
  targetArgs: string;
  owner: { clusterId: string };
  service: string;
}) => {
  // let's look for a job that's already been created with the same cache key
  // and is complete, resolved and not timed out

  // TODO: this check slows everything down. we should consult the service def metadata to see if the function is cacheable, first. good thing is the service metadata is available and cacheable in the control plane
  const existingJob = await data.db
    .select({
      id: data.jobs.id,
    })
    .from(data.jobs)
    .where(
      and(
        eq(data.jobs.target_fn, targetFn),
        eq(data.jobs.target_args, targetArgs),
        eq(data.jobs.status, "success"),
        eq(data.jobs.owner_hash, owner.clusterId),
        eq(data.jobs.service, service),
        eq(data.jobs.result_type, "resolution"),
        gte(data.jobs.cache_expiry_at, new Date())
      )
    )
    .orderBy(desc(data.jobs.created_at))
    .limit(1);

  if (existingJob.length > 0) {
    console.log("Resolving from cache", existingJob[0].id);

    return { id: existingJob[0].id };
  }

  const id = `exec-${targetFn.substring(0, 8)}-${ulid()}`;

  console.log("Creating job", {
    id,
    targetFn,
    service,
  });

  await data.db.insert(data.jobs).values({
    id,
    target_fn: targetFn,
    target_args: targetArgs,
    idempotency_key: `ik_${crypto.randomBytes(64).toString("hex")}`,
    status: "pending",
    owner_hash: owner.clusterId,
    service,
  });

  return { id };
};

export const nextJobs = async ({
  functions,
  pools,
  owner,
  limit,
  machineId,
  ip,
}: {
  functions: string;
  pools?: string;
  owner: { clusterId: string };
  limit: number;
  machineId: string;
  ip: string;
}) => {
  const pool = pools || "*";

  const targetFns = functions.split(",");

  const results = await data.db.execute(
    sql`UPDATE jobs SET status = 'running', remaining = remaining - 1 WHERE id IN (SELECT id FROM jobs WHERE (status = 'pending' OR (status = 'failure' AND remaining > 0)) AND owner_hash = ${owner.clusterId} AND target_fn IN ${targetFns} LIMIT ${limit}) RETURNING *`
  );

  // store machine info. needs to be backgrounded later
  await data.db
    .insert(data.machines)
    .values({
      id: machineId,
      last_ping_at: new Date(),
      machine_type: pool, // TODO: deprecate machine_type
      ip,
      cluster_id: owner.clusterId,
    })
    .onConflictDoUpdate({
      target: data.machines.id,
      set: {
        last_ping_at: new Date(),
        machine_type: pool, // TODO: deprecate machine_type
        ip,
        cluster_id: owner.clusterId, // beacuse we're using the secret key hash as the cluster id
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
