import debug from "debug";
import { readFileSync } from "fs";
import { client } from "./client";

const log = debug("differential:cli:upload");

export const uploadPackage = async (
  packagePath: string,
  definitionPath: string,
  clusterId: string,
  serviceName: string,
): Promise<{ id: string }> => {
  log("Uploading package", { packagePath });

  const deployment = await client.createDeployment({
    params: {
      clusterId,
      serviceName,
    },
  });

  if (deployment.status !== 200) {
    throw new Error(
      "Failed to upload package. Please check provided options and cluster configuration.",
    );
  }

  const { packageUploadUrl, definitionUploadUrl, id } = deployment.body;
  log("Created deployment", { id });

  const results = await Promise.all([
    fetch(packageUploadUrl, {
      method: "PUT",
      body: readFileSync(packagePath),
      headers: {
        "Content-Type": "application/zip",
      },
    }),
    fetch(definitionUploadUrl, {
      method: "PUT",
      body: readFileSync(definitionPath),
      headers: {
        "Content-Type": "application/zip",
      },
    }),
  ]);

  results.forEach((response) => {
    if (response.status !== 200) {
      throw new Error(
        "Failed to upload package. Please check provided options and cluster configuration.",
      );
    }
  });

  log("Uploaded deployment assets", { id });

  return deployment.body;
};
