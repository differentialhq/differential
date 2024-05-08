import debug from "debug";
import { readFileSync } from "fs";
import { client } from "./client";

const log = debug("differential:cli:upload");

export const uploadAsset = async ({
  path,
  target,
  contentType,
  type,
  cluster,
}: {
  path: string;
  target: string;
  contentType: string;
  type: "client_library" | "service_bundle";
  cluster: string;
}): Promise<void> => {
  log(`Uploading asset`);

  const upload = await client.createAsset({
    body: {
      type,
      target,
    },
    params: {
      clusterId: cluster,
    },
  });

  log("Response from createAsset", upload);

  if (upload.status !== 201) {
    throw new Error(
      "Failed to upload asset. Please check provided options and cluster configuration.",
    );
  }

  const { presignedUrl } = upload.body;

  log("Uploading asset to s3", { presignedUrl });

  const response = await fetch(presignedUrl, {
    method: "PUT",
    body: readFileSync(path),
    headers: {
      "Content-Type": contentType,
    },
  });

  log("Response from S3 put", response);

  if (response.status !== 200) {
    throw new Error(
      "Failed to upload asset. Please check provided options and cluster configuration.",
    );
  }
};
