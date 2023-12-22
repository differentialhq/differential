import { sql } from "drizzle-orm";
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

export const createJob = async ({
  targetFn,
  targetArgs,
  owner,
  pool,
}: {
  targetFn: string;
  targetArgs: string;
  owner: { clusterId: string };
  pool?: string;
}) => {
  const id = `exec-${targetFn.substring(0, 8)}-${ulid()}`;

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
