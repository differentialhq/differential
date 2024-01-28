import * as data from "../data";

export const createOwner = async (clusterId = Math.random().toString()) => {
  await data.db
    .insert(data.clusters)
    .values({
      id: clusterId,
      api_secret: "test",
    })
    .execute();

  return { clusterId };
};
