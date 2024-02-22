import { ulid } from "ulid";
import * as data from "../data";
import { UPLOAD_BUCKET, getPresignedURL } from "../s3";
import { and, eq, or, sql } from "drizzle-orm";
import { DeploymentProvider } from "./deployment-provider";
import NodeCache from "node-cache";
import { storeServiceDefinitionBG } from "../service-definitions";

export type Deployment = {
  id: string;
  clusterId: string;
  service: string;
  status: string;
  provider: string;
  assetUploadId: string;
};

export type DeploymentWithUrl = Deployment & {
  packageUploadUrl: string;
};

export const s3AssetDetails = async (
  deployment: Deployment,
): Promise<{ S3Bucket: string; S3Key: string }> => {
  if (!UPLOAD_BUCKET) {
    throw new Error("Upload bucket not configured");
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
}): Promise<DeploymentWithUrl> => {
  if (!UPLOAD_BUCKET) {
    throw new Error("Upload bucket not configured");
  }

  const id = ulid();

  const object = {
    bucket: UPLOAD_BUCKET,
    key: `${clusterId}/${serviceName}/service_bundle/${id}`,
  };

  const packageUploadUrl = await getPresignedURL(object.bucket, object.key);

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
    storeServiceDefinitionBG(serviceName, { name: serviceName }, { clusterId });
  }

  const provider = service?.deployment_provider ?? "mock";

  return await data.db.transaction(async (tx) => {
    const asset = await tx
      .insert(data.assetUploads)
      .values([
        {
          id: ulid(),
          type: "service_bundle",
          bucket: object.bucket,
          key: object.key,
        },
      ])
      .returning({
        id: data.assetUploads.id,
      });

    const deployment = await tx
      .insert(data.deployments)
      .values([
        {
          id: id,
          cluster_id: clusterId,
          service: serviceName,
          asset_upload_id: asset[0].id,
          // Temporary, the expectation is that the deployment will be in the "uploading" while any async work is being done
          status: "ready",
          provider: provider,
        },
      ])
      .returning({
        id: data.deployments.id,
        clusterId: data.deployments.cluster_id,
        service: data.deployments.service,
        status: data.deployments.status,
        provider: data.deployments.provider,
        assetUploadId: data.deployments.asset_upload_id,
      });

    return { ...deployment[0], packageUploadUrl: packageUploadUrl };
  });
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
    })
    .from(data.deployments)
    .where(eq(data.deployments.id, id));

  return deployment[0];
};

export const getDeployments = async (
  cluster: string,
  service: string,
): Promise<Deployment[]> => {
  const deployment = await data.db
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
        eq(data.deployments.cluster_id, cluster),
        eq(data.deployments.service, service),
      ),
    )
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

  // This should happen outside of the request
  // as we should be waiting / checking that the resource has been published before we update the deployment status

  let update;
  await data.db.transaction(async (tx) => {
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

    update = await tx
      .update(data.deployments)
      .set({
        status: "active",
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
