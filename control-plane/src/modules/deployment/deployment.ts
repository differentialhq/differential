import { ulid } from "ulid";
import * as data from "../data";
import { UPLOAD_BUCKET, getPresignedURL } from "../s3";
import { and, eq, or, sql } from "drizzle-orm";
import { DeploymentProvider } from "./deployment-provider";
//import { LambdaProvider } from "./LambdaProvider";
import { MockProvider } from "./mock-deployment-provider";
import NodeCache from "node-cache";
import { LambdaProvider } from "./lambda-provider";

export type Deployment = {
  id: string;
  clusterId: string;
  service: string;
  packageUploadUrl: string;
  definitionUploadUrl: string;
  status: string;
  provider: string;
};

export const s3AssetDetails = (
  deployment: Deployment,
): { S3Bucket: string; S3Key: string } => {
  if (!UPLOAD_BUCKET) {
    throw new Error("Upload bucket not configured");
  }

  return {
    S3Bucket: UPLOAD_BUCKET,
    S3Key: `${deployment.clusterId}/${deployment.service}/${deployment.id}-package`,
  };
};

const providers: { [key: string]: DeploymentProvider } = {
  lambda: new LambdaProvider(),
  mock: new MockProvider(),
};
const getProvider = (provider: string): DeploymentProvider => {
  if (!providers[provider]) {
    throw new Error(`Unknown deployment provider: ${provider}`);
  }
  return providers[provider];
};

export const createDeployment = async ({
  clusterId,
  serviceName,
}: {
  clusterId: string;
  serviceName: string;
}): Promise<Deployment> => {
  if (!UPLOAD_BUCKET) {
    throw new Error("Upload bucket not configured");
  }

  const id = ulid();

  const packageUploadUrl = await getPresignedURL(
    UPLOAD_BUCKET,
    clusterId,
    serviceName,
    `${id}-package`,
  );
  const definitionUploadUrl = await getPresignedURL(
    UPLOAD_BUCKET,
    clusterId,
    serviceName,
    `${id}-definition`,
  );

  const deployment = await data.db
    .insert(data.deployments)
    .values([
      {
        id: id,
        cluster_id: clusterId,
        service: serviceName,
        package_upload_path: packageUploadUrl,
        definition_upload_path: definitionUploadUrl,
        // Temporary, the expectation is that the deployment will be in the "uploading" while any async work is being done
        status: "ready",
      },
    ])
    .returning({
      id: data.deployments.id,
      clusterId: data.deployments.cluster_id,
      service: data.deployments.service,
      packageUploadUrl: data.deployments.package_upload_path,
      definitionUploadUrl: data.deployments.definition_upload_path,
      status: data.deployments.status,
      provider: data.deployments.provider,
    });

  return deployment[0];
};

export const getDeployment = async ({
  clusterId,
  serviceName,
  id,
}: {
  clusterId: string;
  serviceName: string;
  id: string;
}): Promise<Deployment> => {
  const deployment = await data.db
    .select({
      id: data.deployments.id,
      clusterId: data.deployments.cluster_id,
      service: data.deployments.service,
      packageUploadUrl: data.deployments.package_upload_path,
      definitionUploadUrl: data.deployments.definition_upload_path,
      status: data.deployments.status,
      provider: data.deployments.provider,
    })
    .from(data.deployments)
    .where(
      and(
        eq(data.deployments.id, id),
        eq(data.deployments.cluster_id, clusterId),
        eq(data.deployments.service, serviceName),
      ),
    );

  return deployment[0];
};

export const releaseDeployment = async (
  deployment: Deployment,
): Promise<Deployment> => {
  const provider = getProvider(deployment.provider);

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
        packageUploadUrl: data.deployments.package_upload_path,
        definitionUploadUrl: data.deployments.definition_upload_path,
        status: data.deployments.status,
      });
  });

  if (!update) {
    throw new Error("Failed to update deployment");
  }

  return update[0];
};

export const triggerDeployment = async ({
  clusterId,
  serviceName,
}: {
  clusterId: string;
  serviceName: string;
}): Promise<boolean> => {
  const deployment = await findActiveDeployment(clusterId, serviceName);
  if (!deployment) {
    return false;
  }

  const provider = getProvider(deployment.provider);

  // TODO this should be backgrounded, for now just don't await
  provider.trigger(deployment);

  return true;
};

const deploymentCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 100,
  maxKeys: 5000,
});
const findActiveDeployment = async (
  clusterId: string,
  serviceName: string,
): Promise<Deployment | null> => {
  const cached = deploymentCache.get<Deployment | null>(
    `${clusterId}-${serviceName}`,
  );
  if (cached !== undefined) {
    return cached;
  }

  const deployments = await data.db
    .select({
      id: data.deployments.id,
      clusterId: data.deployments.cluster_id,
      service: data.deployments.service,
      packageUploadUrl: data.deployments.package_upload_path,
      definitionUploadUrl: data.deployments.definition_upload_path,
      status: data.deployments.status,
      provider: data.deployments.provider,
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
    deploymentCache.set(`${clusterId}-${serviceName}`, null);
    return null;
  }

  deploymentCache.set(`${clusterId}-${serviceName}`, deployments[0]);
  return deployments[0];
};

const previouslyReleased = async (deployment: Deployment): Promise<boolean> => {
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
