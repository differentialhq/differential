import * as data from "./data";
import { and, eq, gte, sql } from "drizzle-orm";
import { randomName } from "./names";
import crypto from "crypto";
import * as jwt from "./jwt";
import {
  ServiceDefinition,
  parseServiceDefinition,
} from "./service-definitions";

export const getClusters = async ({
  managementToken,
}: {
  managementToken: string;
}): Promise<
  Array<{
    id: string;
    apiSecret: string;
    createdAt: Date;
    description: string | null;
  }>
> => {
  const verified = await jwt.verifyManagementToken({ managementToken });

  const clusters = await data.db
    .select({
      id: data.clusters.id,
      apiSecret: data.clusters.api_secret,
      createdAt: data.clusters.created_at,
      description: data.clusters.description,
    })
    .from(data.clusters)
    .where(eq(data.clusters.owner_id, verified.userId));

  return clusters;
};

export const hasAccessToCluster = async ({
  managementToken,
  clusterId,
}: {
  managementToken: string;
  clusterId: string;
}): Promise<boolean> => {
  const verified = await jwt.verifyManagementToken({ managementToken });

  const clusters = await data.db
    .select({
      id: data.clusters.id,
    })
    .from(data.clusters)
    .where(
      and(
        eq(data.clusters.id, clusterId),
        eq(data.clusters.owner_id, verified.userId)
      )
    );

  return clusters.length > 0;
};

export const createCluster = async ({
  managementToken,
  description,
}: {
  managementToken: string;
  description: string;
}): Promise<void> => {
  const verified = await jwt.verifyManagementToken({ managementToken });

  await data.db
    .insert(data.clusters)
    .values([
      {
        id: `cluster-${randomName("-")}-${crypto
          .randomBytes(5)
          .toString("hex")}`,
        owner_id: verified.userId,
        api_secret: `sk_${crypto.randomBytes(32).toString("hex")}`,
        description,
      },
    ])
    .execute();
};

export const getClusterDetailsForUser = async ({
  managementToken,
  clusterId,
}: {
  managementToken: string;
  clusterId: string;
}): Promise<
  | {
      id: string;
      apiSecret: string;
      createdAt: Date;
      machines: Array<{
        id: string;
        description: string | null;
        pool: string | null;
        lastPingAt: Date | null;
        ip: string | null;
      }>;
      jobs: Array<{
        id: string;
        targetFn: string;
        service: string | null;
        resultType: string | null;
        status: string;
        createdAt: Date;
        functionExecutionTime: number | null;
      }>;
      definitions: Array<ServiceDefinition>;
    }
  | undefined
> => {
  const verified = await jwt.verifyManagementToken({ managementToken });

  // TODO: make this a single query

  const clusters = await data.db
    .select({
      id: data.clusters.id,
      apiSecret: data.clusters.api_secret,
      createdAt: data.clusters.created_at,
      foo: data.services.cluster_id,
      definitions: data.services.definition,
    })
    .from(data.clusters)
    .where(
      and(
        eq(data.clusters.id, clusterId),
        eq(data.clusters.owner_id, verified.userId)
      )
    )
    .leftJoin(data.services, eq(data.services.cluster_id, data.clusters.id));

  console.log({ clusters });

  if (clusters.length === 0) {
    return undefined;
  }

  const machines = await data.db
    .select({
      id: data.machines.id,
      description: data.machines.description,
      pool: data.machines.machine_type,
      lastPingAt: data.machines.last_ping_at,
      ip: data.machines.ip,
    })
    .from(data.machines)
    .where(
      and(
        eq(data.machines.cluster_id, clusterId),
        // in the last 12 hours
        gte(
          data.machines.last_ping_at,
          new Date(Date.now() - 1000 * 60 * 60 * 12)
        )
      )
    );

  const jobs = await data.db
    .select({
      id: data.jobs.id,
      targetFn: data.jobs.target_fn,
      service: data.jobs.service,
      status: data.jobs.status,
      resultType: data.jobs.result_type,
      createdAt: data.jobs.created_at,
      functionExecutionTime: data.jobs.function_execution_time_ms,
    })
    .from(data.jobs)
    .where(
      and(
        eq(data.jobs.owner_hash, clusterId),
        // in the last 12 hours
        gte(data.jobs.created_at, new Date(Date.now() - 1000 * 60 * 60 * 12))
      )
    );

  return {
    id: clusters[0].id,
    apiSecret: clusters[0].apiSecret,
    createdAt: clusters[0].createdAt,
    definitions: parseServiceDefinition(clusters.map((c) => c.definitions)),
    machines,
    jobs,
  };
};
