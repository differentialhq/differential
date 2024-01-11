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

type FunctionDetails = {
  name: string;
  avgExecutionTimeSuccess: number | null;
  avgExecutionTimeFailure: number | null;
  totalSuccess: number;
  totalFailure: number;
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
      services: Array<{
        name: string;
        functions: Array<FunctionDetails>;
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

  // Fetch all function / service combinations for the cluster within the last 12 hours
  // This can be replaced with something more robust once we have a catalog of service / functions
  const functions = await data.db
    .select({
      service: data.jobs.service,
      target_fn: data.jobs.target_fn,
      avgExecutionTime:
        sql`avg(${data.jobs.function_execution_time_ms})`.mapWith(Number),
      total: sql`count(${data.jobs.id})`.mapWith(Number),
      result_type: data.jobs.result_type,
    })
    .from(data.jobs)
    .groupBy(data.jobs.service, data.jobs.target_fn, data.jobs.result_type)
    .where(
      and(
        eq(data.jobs.owner_hash, clusterId),
        // in the last 12 hours
        gte(data.jobs.created_at, new Date(Date.now() - 1000 * 60 * 60 * 12))
      )
    );

  // Build a map of service -> function -> details merging the error and success results
  const serviceFnMap = functions.reduce(
    (acc, current) => {
      const serviceName = current.service;
      if (!serviceName) {
        return acc;
      }

      const isSuccess = current.result_type === "resolution";

      const service = acc.get(serviceName) ?? new Map();
      service.set(current.target_fn, {
        ...(isSuccess
          ? { avgExecutionTimeSuccess: current.avgExecutionTime }
          : { avgExecutionTimeFailure: current.avgExecutionTime }),
        ...(isSuccess
          ? { totalSuccess: current.total }
          : { totalFailure: current.total }),
        ...service.get(current.target_fn),
      });

      acc.set(serviceName, service);

      return acc;
    },
    new Map() as Map<string, Map<string, Omit<FunctionDetails, "name">>>
  );

  const serviceResult = Array.from(serviceFnMap).map(([name, functionMap]) => ({
    name: name,
    functions: Array.from(functionMap).map(([fnName, fnDetails]) => ({
      name: fnName,
      ...fnDetails,
      // If there is no success or failure, default to 0
      totalSuccess: fnDetails.totalSuccess ?? 0,
      totalFailure: fnDetails.totalFailure ?? 0,
    })),
  }));

  console.log({ clusters });

  return {
    id: clusters[0].id,
    apiSecret: clusters[0].apiSecret,
    createdAt: clusters[0].createdAt,
    definitions: parseServiceDefinition(clusters.map((c) => c.definitions)),
    machines,
    jobs,
    services: serviceResult,
  };
};
