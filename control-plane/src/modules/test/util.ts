import * as data from "../data";

export const createOwner = async (params?: { clusterId?: string }) => {
  const clusterId = params?.clusterId || `test-cluster-${Math.random()}`;

  const apiSecret = `test-secret-${Math.random()}`;

  await data.db
    .insert(data.clusters)
    .values({
      id: clusterId,
      api_secret: apiSecret,
    })
    .execute();

  return { clusterId, apiSecret };
};
