import {
  SemVerIncrement,
  incrementVersion,
  previousVersion,
} from "./versioning";
import * as data from "../data";
import { ulid } from "ulid";
import { and, desc, eq, isNotNull } from "drizzle-orm";

type ClientLibraryVersion = {
  id: string;
  version: string;
};

type ClientLibraryVersionWithAsset = ClientLibraryVersion & {
  key: string;
  bucket: string;
  uploadedAt: Date;
};

export const createClientLibraryVersion = async ({
  clusterId,
  increment,
}: {
  clusterId: string;
  increment: SemVerIncrement;
}): Promise<ClientLibraryVersion> => {
  const previous = await previousVersion({ clusterId });
  const version = incrementVersion({ version: previous, increment });

  console.log("Creating client library version", {
    version,
    previous,
    increment,
  });

  const client = await data.db
    .insert(data.clientLibraryVersions)
    .values({
      id: ulid(),
      cluster_id: clusterId,
      version: version,
    })
    .returning({
      id: data.clientLibraryVersions.id,
      version: data.clientLibraryVersions.version,
    });

  if (client.length === 0) {
    throw new Error("Failed to create client library version");
  }

  return client[0];
};

export const getClientLibraryVersions = async ({
  clusterId,
}: {
  clusterId: string;
}): Promise<ClientLibraryVersionWithAsset[]> => {
  const clients = await data.db
    .select({
      id: data.clientLibraryVersions.id,
      version: data.clientLibraryVersions.version,
      uploadedAt: data.assetUploads.created_at,
      key: data.assetUploads.key,
      bucket: data.assetUploads.bucket,
    })
    .from(data.clientLibraryVersions)
    .innerJoin(
      data.assetUploads,
      eq(data.clientLibraryVersions.asset_upload_id, data.assetUploads.id),
    )
    .where(
      and(
        eq(data.clientLibraryVersions.cluster_id, clusterId),
        isNotNull(data.clientLibraryVersions.asset_upload_id),
      ),
    )
    .orderBy(desc(data.assetUploads.created_at));

  return clients;
};

export const getClientLibraryVersion = async ({
  version,
  clusterId,
}: {
  version: string;
  clusterId: string;
}): Promise<ClientLibraryVersionWithAsset | undefined> => {
  const client = await data.db
    .select({
      id: data.clientLibraryVersions.id,
      version: data.clientLibraryVersions.version,
      uploadedAt: data.assetUploads.created_at,
      key: data.assetUploads.key,
      bucket: data.assetUploads.bucket,
    })
    .from(data.clientLibraryVersions)
    .innerJoin(
      data.assetUploads,
      eq(data.clientLibraryVersions.asset_upload_id, data.assetUploads.id),
    )
    .where(
      and(
        eq(data.clientLibraryVersions.cluster_id, clusterId),
        eq(data.clientLibraryVersions.version, version),
        isNotNull(data.clientLibraryVersions.asset_upload_id),
      ),
    );

  return client[0];
};
