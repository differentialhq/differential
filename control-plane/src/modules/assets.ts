import * as data from "./data";
import { ulid } from "ulid";
import { and, eq } from "drizzle-orm";
import { UPLOAD_BUCKET, getPresignedURL } from "./s3";

export type AssetType = "client_library" | "service_bundle";

export const createAssetUploadWithTarget = async (
  target: string,
  clusterId: string,
  type: AssetType,
): Promise<string | null> => {
  const id = ulid();
  const key = `${type}/${id}`;
  if (!UPLOAD_BUCKET) {
    throw new Error("Upload bucket not configured");
  }
  const bucket = UPLOAD_BUCKET;

  switch (type) {
    case "client_library": {
      const version = await data.db
        .select({
          version: data.clientLibraryVersions.version,
        })
        .from(data.clientLibraryVersions)
        .where(
          and(
            eq(data.clientLibraryVersions.cluster_id, clusterId),
            eq(data.clientLibraryVersions.id, target),
          ),
        );

      if (version.length == 0) {
        console.warn("Could not find client version for target", {
          target,
          clusterId,
        });
        return null;
      }

      await data.db.transaction(async (tx) => {
        await tx
          .insert(data.assetUploads)
          .values({
            id,
            type: type,
            bucket: bucket,
            key: key,
          })
          .returning({
            id: data.assetUploads.id,
          });

        await tx
          .update(data.clientLibraryVersions)
          .set({
            asset_upload_id: id,
          })
          .where(
            and(
              eq(data.clientLibraryVersions.cluster_id, clusterId),
              eq(data.clientLibraryVersions.id, target),
            ),
          );
      });
      break;
    }
    case "service_bundle": {
      const deployment = await data.db
        .select({
          id: data.deployments.id,
        })
        .from(data.deployments)
        .where(
          and(
            eq(data.deployments.cluster_id, clusterId),
            eq(data.deployments.id, target),
          ),
        );

      if (deployment.length == 0) {
        console.warn("Could not find deployment for target", {
          target,
          clusterId,
        });
        return null;
      }

      await data.db.transaction(async (tx) => {
        await tx
          .insert(data.assetUploads)
          .values({
            id,
            type: type,
            bucket: bucket,
            key: key,
          })
          .returning({
            id: data.assetUploads.id,
          });

        await tx
          .update(data.deployments)
          .set({
            asset_upload_id: id,
          })
          .where(eq(data.deployments.id, target));
      });
      break;
    }
    default: {
      console.warn("Invalid asset type provided", {
        type,
      });
      return null;
    }
  }

  return getPresignedURL(bucket, key);
};
