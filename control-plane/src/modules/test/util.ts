import * as data from "../data";

export const createOwner = async (params?: {
  clusterId?: string;
  predictiveRetriesEnabled?: boolean;
}) => {
  const clusterId = params?.clusterId || `test-cluster-${Math.random()}`;

  await data.db
    .insert(data.clusters)
    .values({
      id: clusterId,
      api_secret: "test",
      predictive_retries_enabled: params?.predictiveRetriesEnabled,
    })
    .execute();

  return { clusterId };
};
