import { and, eq, ne, or, sql } from "drizzle-orm";
import NodeCache from "node-cache";
import { ulid } from "ulid";
import * as data from "../data";
import { storeServiceDefinition } from "../service-definitions";
import {
  DeploymentProvider,
  getDeploymentProvider,
} from "./deployment-provider";
import * as events from "../observability/events";
import { env } from "../../utilities/env";
import { logger } from "../../utilities/logger";

export type Deployment = {
  id: string;
  clusterId: string;
  service: string;
  status: "uploading" | "active" | "inactive" | "failed" | "cancelled";
  provider: string;
  assetUploadId?: string | null;
  createdAt: Date;
};

export const s3AssetDetails = async (
  deployment: Deployment,
): Promise<{ S3Bucket: string; S3Key: string }> => {
  if (!deployment.assetUploadId) {
    throw new Error("Deployment does not have an asset upload");
  }

  const asset = await data.db
    .select({
      key: data.assetUploads.key,
      bucket: data.assetUploads.bucket,
    })
    .from(data.assetUploads)
    .where(eq(data.assetUploads.id, deployment.assetUploadId));

  return {
    S3Bucket: asset[0].bucket,
    S3Key: asset[0].key,
  };
};

export const createDeployment = async ({
  clusterId,
  serviceName,
}: {
  clusterId: string;
  serviceName: string;
}): Promise<Deployment> => {
  const service = (
    await data.db
      .select({
        preferred_deployment_provider:
          data.services.preferred_deployment_provider,
      })
      .from(data.services)
      .where(
        and(
          eq(data.services.service, serviceName),
          eq(data.services.cluster_id, clusterId),
        ),
      )
  ).shift();

  if (!service) {
    logger.info("Service not found, creating service definition", {
      clusterId,
      service: serviceName,
    });
    storeServiceDefinition(serviceName, { name: serviceName }, { clusterId });
  }

  const provider =
    service?.preferred_deployment_provider ?? env.DEPLOYMENT_DEFAULT_PROVIDER;

  logger.info("Creating deployment", {
    clusterId,
    service,
    provider,
  });

  const deployment = await data.db
    .insert(data.deployments)
    .values([
      {
        id: ulid(),
        cluster_id: clusterId,
        service: serviceName,
        status: "uploading",
        provider: provider,
      },
    ])
    .returning({
      id: data.deployments.id,
      clusterId: data.deployments.cluster_id,
      service: data.deployments.service,
      status: data.deployments.status,
      provider: data.deployments.provider,
      createdAt: data.deployments.created_at,
      assetUploadId: data.deployments.asset_upload_id,
    });

  return deployment[0];
};

export const getDeployment = async (id: string): Promise<Deployment> => {
  const deployment = await data.db
    .select({
      id: data.deployments.id,
      clusterId: data.deployments.cluster_id,
      service: data.deployments.service,
      status: data.deployments.status,
      provider: data.deployments.provider,
      assetUploadId: data.deployments.asset_upload_id,
      createdAt: data.deployments.created_at,
    })
    .from(data.deployments)
    .where(eq(data.deployments.id, id));

  return deployment[0];
};

export const getDeployments = async (
  cluster: string,
  service?: string,
): Promise<Deployment[]> => {
  const whereClause = service
    ? and(
        eq(data.deployments.cluster_id, cluster),
        eq(data.deployments.service, service),
      )
    : eq(data.deployments.cluster_id, cluster);

  const deployment = await data.db
    .select({
      id: data.deployments.id,
      clusterId: data.deployments.cluster_id,
      service: data.deployments.service,
      status: data.deployments.status,
      provider: data.deployments.provider,
      assetUploadId: data.deployments.asset_upload_id,
      createdAt: data.deployments.created_at,
    })
    .from(data.deployments)
    .where(whereClause)
    .orderBy(
      sql`case when ${data.deployments.status} = 'active' then 1 else 2 end`,
    );

  return deployment;
};

export const releaseDeployment = async (
  deployment: Deployment,
  provider: DeploymentProvider,
): Promise<Deployment> => {
  logger.info("Releasing deployment", {
    clusterId: deployment.clusterId,
    service: deployment.service,
    deploymentId: deployment.id,
  });

  // Check if the service has been previously "released" (active or inactive) deployment
  const meta = (await previouslyReleased(deployment))
    ? await provider.update(deployment)
    : await provider.create(deployment);

  const [update] = await data.db
    .update(data.deployments)
    .set({
      meta: meta ?? {},
    })
    .where(eq(data.deployments.id, deployment.id))
    .returning({
      id: data.deployments.id,
      clusterId: data.deployments.cluster_id,
      service: data.deployments.service,
      status: data.deployments.status,
      provider: data.deployments.provider,
      createdAt: data.deployments.created_at,
    });

  if (!update) {
    throw new Error("Failed to update deployment");
  }

  events.write({
    type: "deploymentInitiated",
    deploymentId: update.id,
    service: update.service,
    clusterId: update.clusterId,
    meta: {
      deploymentStatus: update.status,
    },
  });

  return update;
};

export const getDeploymentLogs = async (
  deployment: Deployment,
  nextToken?: string,
): Promise<{ message: string }[]> => {
  const provider = getDeploymentProvider(deployment.provider);
  return await provider.getLogs(deployment, nextToken);
};

const inactivateExistingDeployments = async (
  replacement: Deployment,
): Promise<void> => {
  logger.info("Inactivating existing deployments", {
    clusterId: replacement.clusterId,
    service: replacement.service,
    replacementDeployment: replacement,
  });

  const inctivatedDeployments = await data.db
    .update(data.deployments)
    .set({
      status: "inactive",
    })
    .where(
      and(
        eq(data.deployments.cluster_id, replacement.clusterId),
        eq(data.deployments.service, replacement.service),
        eq(data.deployments.status, "active"),
        ne(data.deployments.id, replacement.id),
      ),
    )
    .returning({
      id: data.deployments.id,
      clusterId: data.deployments.cluster_id,
      service: data.deployments.service,
      status: data.deployments.status,
      provider: data.deployments.provider,
      createdAt: data.deployments.created_at,
    });

  deploymentCache.del(`${replacement.clusterId}-${replacement.service}`);

  if (inctivatedDeployments.length > 1) {
    logger.warn(
      "Found more than one previous active deployment for service, this is unexpected.",
      {
        clusterId: replacement.clusterId,
        service: replacement.service,
        activeDeployments: inctivatedDeployments,
        replacementDeployment: replacement,
      },
    );
  }

  for (const replaced of inctivatedDeployments) {
    events.write({
      type: "deploymentInactivated",
      deploymentId: replaced.id,
      service: replaced.service,
      clusterId: replaced.clusterId,
      meta: {
        deploymentStatus: replaced.status,
        replacedBy: replacement.id,
      },
    });
  }
};

const deploymentCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 100,
  maxKeys: 5000,
});
export const findActiveDeployment = async (
  clusterId: string,
  serviceName: string,
): Promise<Pick<Deployment, "id"> | null> => {
  const cacheKey = `${clusterId}-${serviceName}`;
  const cached = deploymentCache.get<Deployment | null>(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const deployments = await data.db
    .select({
      id: data.deployments.id,
    })
    .from(data.deployments)
    .where(
      and(
        eq(data.deployments.cluster_id, clusterId),
        eq(data.deployments.service, serviceName),
        eq(data.deployments.status, "active"),
      ),
    );

  if (deployments.length === 0) {
    deploymentCache.set(cacheKey, null);
    return null;
  }

  deploymentCache.set(cacheKey, deployments[0]);
  return deployments[0];
};

export const getAllPendingDeployments = async (
  provider: "lambda" | "mock",
): Promise<Deployment[]> => {
  const deployments = await data.db
    .select({
      id: data.deployments.id,
      clusterId: data.deployments.cluster_id,
      service: data.deployments.service,
      status: data.deployments.status,
      provider: data.deployments.provider,
      assetUploadId: data.deployments.asset_upload_id,
      createdAt: data.deployments.created_at,
    })
    .from(data.deployments)
    .where(
      and(
        eq(data.deployments.status, "uploading"),
        eq(data.deployments.provider, provider),
      ),
    );

  return deployments;
};

export const updateDeploymentResult = async (
  deployment: { id: string },
  status: "active" | "failed" | "uploading",
  meta?: any,
) => {
  const [result] = await data.db
    .update(data.deployments)
    .set({
      status: status,
      meta: meta,
    })
    .where(eq(data.deployments.id, deployment.id))
    .returning({
      id: data.deployments.id,
      clusterId: data.deployments.cluster_id,
      service: data.deployments.service,
      status: data.deployments.status,
      provider: data.deployments.provider,
      createdAt: data.deployments.created_at,
    });

  if (!result) {
    throw new Error("Failed to update deployment with result");
  }

  logger.info("Updated deployment result", {
    deploymentId: deployment.id,
    service: result.service,
    clusterId: result.clusterId,
    status,
  });

  if (!["active", "failed"].includes(status)) {
    return;
  }

  if (status === "active") {
    await inactivateExistingDeployments(result);
  }

  events.write({
    type: "deploymentResulted",
    deploymentId: result.id,
    service: result.service,
    clusterId: result.clusterId,
    meta: {
      deploymentStatus: status,
    },
  });
};

const previouslyReleased = async (deployment: Deployment): Promise<boolean> => {
  if (await findActiveDeployment(deployment.clusterId, deployment.service)) {
    return true;
  }
  const releases = await data.db
    .select({
      count: sql<number>`count(${data.deployments.id})`,
    })
    .from(data.deployments)
    .where(
      and(
        eq(data.deployments.cluster_id, deployment.clusterId),
        eq(data.deployments.service, deployment.service),
        or(
          eq(data.deployments.status, "active"),
          eq(data.deployments.status, "inactive"),
        ),
      ),
    );

  return releases[0].count > 0;
};
