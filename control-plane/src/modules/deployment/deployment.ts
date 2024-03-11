import { and, eq, ne, or, sql } from "drizzle-orm";
import NodeCache from "node-cache";
import { ulid } from "ulid";
import * as data from "../data";
import { storeServiceDefinition } from "../service-definitions";
import { DeploymentProvider } from "./deployment-provider";

export type Deployment = {
  id: string;
  clusterId: string;
  service: string;
  status: string;
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
      .select({ deployment_provider: data.services.deployment_provider })
      .from(data.services)
      .where(
        and(
          eq(data.services.service, serviceName),
          eq(data.services.cluster_id, clusterId),
        ),
      )
  ).shift();

  if (!service) {
    console.log("Service not found, creating service definition");
    storeServiceDefinition(serviceName, { name: serviceName }, { clusterId });
  }

  const provider = service?.deployment_provider ?? "lambda";

  const deployment = await data.db
    .insert(data.deployments)
    .values([
      {
        id: ulid(),
        cluster_id: clusterId,
        service: serviceName,
        // Temporary, the expectation is that the deployment will be in the "uploading" while any async work is being done
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
  // Check if the service has been previously "released" (active or inactive) deployment
  const meta = (await previouslyReleased(deployment))
    ? await provider.update(deployment)
    : await provider.create(deployment);

  let update;
  await data.db.transaction(async (tx) => {
    // Mark existing active deployment as inactive
    await tx
      .update(data.deployments)
      .set({
        status: "inactive",
      })
      .where(
        and(
          eq(data.deployments.cluster_id, deployment.clusterId),
          eq(data.deployments.service, deployment.service),
          eq(data.deployments.status, "active"),
        ),
      );

    // Update the deployment with metadata from the provider (stackId, etx)
    update = await tx
      .update(data.deployments)
      .set({
        meta: meta,
      })
      .where(eq(data.deployments.id, deployment.id))
      .returning({
        id: data.deployments.id,
        clusterId: data.deployments.cluster_id,
        service: data.deployments.service,
        status: data.deployments.status,
      });
  });

  if (!update) {
    throw new Error("Failed to update deployment");
  }

  return update[0];
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
  deployment: Deployment,
  status: "active" | "failed",
  meta?: any,
) => {
  await data.db
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
