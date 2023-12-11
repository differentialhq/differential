import { sql } from "drizzle-orm";
import { QueryResult } from "pg";
import * as data from "./data";

export const nextJobs = async ({
  functions,
  pools,
  owner,
  limit,
  machineId,
  ip,
}: {
  functions?: string;
  pools?: string;
  owner: { clusterId: string };
  limit: number;
  machineId: string;
  ip: string;
}) => {
  let results: QueryResult<Record<string, unknown>>;

  const pool = pools || "*";

  if (functions) {
    const targetFns = functions.split(",");

    results = await data.db.execute(
      sql`UPDATE jobs SET status = 'running', remaining = remaining - 1 WHERE id IN (SELECT id FROM jobs WHERE (status = 'pending' OR (status = 'failure' AND remaining > 0)) AND owner_hash = ${owner.clusterId} AND target_fn IN ${targetFns} LIMIT ${limit}) RETURNING *`
    );
  } else {
    // drizzle raw query to update the status of the jobs
    results = await data.db.execute(
      sql`UPDATE jobs SET status = 'running', remaining = remaining - 1 WHERE id IN (SELECT id FROM jobs WHERE (status = 'pending' OR (status = 'failure' AND remaining > 0)) AND owner_hash = ${owner.clusterId} AND (machine_type IS NULL OR machine_type = ${pool}) LIMIT ${limit}) RETURNING *`
    );
  }

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
