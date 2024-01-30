import { initClient, tsRestFetchApi } from "@ts-rest/core";
import debug from "debug";
import { readFileSync } from "fs";
import { contract } from "../client/contract";

const log = debug("differential:cli:upload");

const client = initClient(contract, {
  baseUrl: process.env.DIFFERENTIAL_API_URL || "https://api.differential.dev",
  baseHeaders: {
    authorization: `Bearer ${process.env.DIFFERENTIAL_API_TOKEN}`,
  },
  api: tsRestFetchApi,
});

export const uploadPackage = async (
  packagePath: string,
  definitionPath: string,
  clusterId: string,
  serviceName: string,
): Promise<void> => {
  log("Uploading package", { packagePath });

  const result = await client.getDeploymentUploadDetails({
    params: {
      clusterId,
      serviceName,
    },
  });

  if (result.status !== 200) {
    throw new Error(
      "Failed to upload package. Please check provided options and cluster configuration.",
    );
  }

  const { packageUploadUrl, definitionUploadUrl } = result.body;

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
};
