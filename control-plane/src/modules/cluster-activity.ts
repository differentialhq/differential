import Cache from "node-cache";

const cache = new Cache({ stdTTL: 60, maxKeys: 1000 });

export const setClusterActivityToHigh = (clusterId: string) => {
  cache.set(clusterId, true);
};

export const isClusterActivityHigh = (clusterId: string) => {
  return cache.get(clusterId) === true;
};
