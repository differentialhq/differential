import { client } from "./client";

export const release = async ({
  deploymentId,
  clusterId,
  serviceName,
}: {
  deploymentId: string;
  clusterId: string;
  serviceName: string;
}) => {
  const result = await client.releaseDeployment({
    params: {
      deploymentId,
      clusterId,
      serviceName,
    },
  });
  if (result.status !== 200) {
    throw new Error(
      "Failed to deploy service. Please check provided options and cluster configuration.",
    );
  }
};
