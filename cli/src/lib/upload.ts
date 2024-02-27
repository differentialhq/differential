import debug from "debug";
import { readFileSync } from "fs";
import { client } from "./client";

const log = debug("differential:cli:upload");

export const uploadAsset = async ({
  zipPath,
  target,
  type,
  cluster,
}: {
  zipPath: string;
  target: string;
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

  const response = await fetch(presignedUrl, {
    method: "PUT",
    body: readFileSync(zipPath),
    headers: {
      "Content-Type": "application/zip",
    },
  });

  if (response.status !== 200) {
    throw new Error(
      "Failed to upload asset. Please check provided options and cluster configuration.",
    );
  }
};
