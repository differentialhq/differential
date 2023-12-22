import crypto from "crypto";
import { and, desc, eq, gt, lte, sql } from "drizzle-orm";
import * as data from "./data";
import { randomName } from "./names";

// TODO(good-first-issue): move to cluster.ts
export const getClusters = async ({
  organizationId,
}: {
  organizationId: string;
}) => {
  // TODO: make a single query
  const machines = await data.db
    .select({
      count: sql<number>`count(${data.machines.id})`,
      maxLastPingAt: sql<Date>`max(${data.machines.last_ping_at})`,
      clusterId: data.machines.cluster_id,
    })
    .from(data.machines)
    .where(
      and(
        eq(data.machines.cluster_id, organizationId),
        lte(data.machines.last_ping_at, new Date(Date.now() - 60 * 60 * 1000))
      )
    )
    .groupBy(({ clusterId }) => clusterId);

  const clusters = await data.db
    .select({
      id: data.clusters.id,
      apiSecret: data.clusters.api_secret,
      organizationId: data.clusters.organization_id,
      createdAt: data.clusters.created_at,
    })
    .from(data.clusters)
    .where(eq(data.clusters.organization_id, organizationId));

  return clusters.map((cluster) => {
    const machine = machines.find(
      (machine) => machine.clusterId === cluster.id
    );

    return {
      ...cluster,
      machineCount: machine?.count || 0,
      lastPingAt: machine?.maxLastPingAt || null,
    };
  });
};

// TODO(good-first-issue): move to cluster.ts and rename to createTemporaryCluster
export const createTemporaryCredential = async () => {
  const created = await data.db
    .insert(data.clusters)
    .values([
      {
        id: `cluster-temp-${randomName("-")}-${crypto
          .randomBytes(8)
          .toString("hex")}`,
        organization_id: "temp",
        api_secret: `sk_temp_${crypto.randomBytes(16).toString("hex")}`,
      },
    ])
    .returning({
      id: data.clusters.id,
      apiSecret: data.clusters.api_secret,
      organizationId: data.clusters.organization_id,
    });

  return created[0];
};

// TODO(good-first-issue): move to cluster.ts
export const getClusterDetails = async ({
  clusterId,
}: {
  clusterId: string;
}) => {
  const [cluster] = await data.db
    .select({
      id: data.clusters.id,
      apiSecret: data.clusters.api_secret,
      organizationId: data.clusters.organization_id,
      createdAt: data.clusters.created_at,
    })
    .from(data.clusters)
    .where(eq(data.clusters.id, clusterId));

  const machines = await data.db
    .select({
      id: data.machines.id,
      description: data.machines.description,
      pool: data.machines.machine_type,
      lastPingAt: data.machines.last_ping_at,
      ip: data.machines.ip,
      organizationId: data.machines.cluster_id,
    })
    .from(data.machines)
    .where(
      and(
        eq(data.machines.cluster_id, clusterId),
        gt(data.machines.last_ping_at, sql<Date>`now() - interval '1 day'`)
      )
    );

  const jobs = await data.db
    .select({
      id: data.jobs.id,
      status: data.jobs.status,
      createdAt: data.jobs.created_at,
      targetFn: data.jobs.target_fn,
      resultType: data.jobs.result_type,
      remaining: data.jobs.remaining,
    })
    .from(data.jobs)
    .where(eq(data.jobs.owner_hash, clusterId))
    .orderBy(desc(data.jobs.created_at))
    .limit(100);

  return {
    ...cluster,
    machines,
    jobs,
  };
};
