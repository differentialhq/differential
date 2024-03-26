import crypto from "crypto";
import { and, eq, gte } from "drizzle-orm";
import * as errors from "../utilities/errors";
import * as data from "./data";
import * as jwt from "./jwt";
import { randomName } from "./names";
import {
  ServiceDefinition,
  parseServiceDefinition,
} from "./service-definitions";
import { getDeployments } from "./deployment/deployment";

type Job = {
  id: string;
  targetFn: string;
  service: string | null;
  resultType: string | null;
  status: string;
  createdAt: Date;
  functionExecutionTime: number | null;
};

type Machine = {
  id: string;
  description: string | null;
  lastPingAt: Date | null;
  ip: string | null;
  deploymentId: string | null;
};

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

  if (verified.userId === jwt.CONTROL_PLANE_ADMINISTRATOR) {
    return true;
  }

  const clusters = await data.db
    .select({
      id: data.clusters.id,
    })
    .from(data.clusters)
    .where(
      and(
        eq(data.clusters.id, clusterId),
        eq(data.clusters.owner_id, verified.userId),
      ),
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
  clusterId,
}: {
  clusterId: string;
}): Promise<{
  id: string;
  apiSecret: string;
  createdAt: Date;
  machines: Array<Machine>;
  jobs: Array<Job>;
  deployments: Array<{
    id: string;
  }>;
  definitions: Array<ServiceDefinition>;
}> => {
  const clusters = await data.db
    .select({
      id: data.clusters.id,
      apiSecret: data.clusters.api_secret,
      createdAt: data.clusters.created_at,
      foo: data.services.cluster_id,
      definitions: data.services.definition,
    })
    .from(data.clusters)
    .where(and(eq(data.clusters.id, clusterId)))
    .leftJoin(data.services, eq(data.services.cluster_id, data.clusters.id));

  if (clusters.length === 0) {
    throw new errors.NotFoundError("Cluster not found");
  }

  const machines = await data.db
    .select({
      id: data.machines.id,
      description: data.machines.description,
      lastPingAt: data.machines.last_ping_at,
      ip: data.machines.ip,
      deploymentId: data.machines.deployment_id,
    })
    .from(data.machines)
    .where(
      and(
        eq(data.machines.cluster_id, clusterId),
        // in the last 1 hour
        gte(
          data.machines.last_ping_at,
          new Date(Date.now() - 1000 * 60 * 60 * 1),
        ),
      ),
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
        // in the last 5 minutes
        gte(data.jobs.created_at, new Date(Date.now() - 1000 * 60 * 5)),
      ),
    );

  const deployments = await getDeployments(clusterId);

  return {
    id: clusters[0].id,
    apiSecret: clusters[0].apiSecret,
    createdAt: clusters[0].createdAt,
    definitions: parseServiceDefinition(clusters.map((c) => c.definitions)),
    deployments,
    machines,
    jobs,
  };
};

export const getClusterServiceDetailsForUser = async ({
  clusterId,
  serviceName,
  limit,
}: {
  clusterId: string;
  serviceName: string;
  limit: number;
}): Promise<{
  jobs: Array<Job>;
  definition: ServiceDefinition | null;
}> => {
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
        eq(data.jobs.service, serviceName),
      ),
    )
    .limit(limit);

  const clusters = await data.db
    .select({
      id: data.clusters.id,
      definitions: data.services.definition,
    })
    .from(data.clusters)
    .where(and(eq(data.clusters.id, clusterId)))
    .leftJoin(data.services, eq(data.services.cluster_id, data.clusters.id));

  return {
    jobs,
    definition:
      parseServiceDefinition(clusters.map((c) => c.definitions)).find(
        (c) => c.name === serviceName,
      ) ?? null,
  };
};

export const setClusterSettings = async (
  clusterId: string,
  settings: {
    predictiveRetriesEnabled?: boolean;
  },
): Promise<void> => {
  const current = await getClusterSettings(clusterId);

  await data.db
    .update(data.clusters)
    .set({
      predictive_retries_enabled:
        settings.predictiveRetriesEnabled ?? current.predictiveRetriesEnabled,
    })
    .where(eq(data.clusters.id, clusterId));
};

export const getClusterSettings = async (clusterId: string) => {
  const [settings] = await data.db
    .select({
      predictiveRetriesEnabled: data.clusters.predictive_retries_enabled,
      cloudEnabled: data.clusters.cloud_enabled,
    })
    .from(data.clusters)
    .where(eq(data.clusters.id, clusterId));

  return settings;
};
