import { initClient, tsRestFetchApi } from "@ts-rest/core";
import { contract } from "../client/contract";

import { getToken } from "../lib/auth";
import { API_URL } from "../constants";

export const client = initClient(contract, {
  baseUrl: API_URL,
  baseHeaders: {
    authorization: `Bearer ${getToken()}`,
  },
  api: tsRestFetchApi,
});

export const waitForDeploymentStatus = async (
  deploymentId: string,
  serviceName: string,
  clusterId: string,
  target: string,
  maxAttempts: number = 10,
) => {
  const checkDeployment = () =>
    client.getDeployment({
      params: {
        deploymentId,
        clusterId,
        serviceName,
      },
    });

  let attempts = 0;
  while (attempts < maxAttempts) {
    attempts++;
    const result = await checkDeployment();

    if (result.status == 200 && result.body.status === target) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(
    "Failed to check deployment status. Please check provided options and cluster configuration.",
  );
};
