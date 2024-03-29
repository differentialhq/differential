import * as data from "../data";

export const createOwner = async (params?: { clusterId?: string }) => {
  const clusterId = params?.clusterId || `test-cluster-${Math.random()}`;

  await data.db
    .insert(data.clusters)
    .values({
      id: clusterId,
      api_secret: `test-secret-${Math.random()}`,
    })
    .execute();

  return { clusterId };
};
