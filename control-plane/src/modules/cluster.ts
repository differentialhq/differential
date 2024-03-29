import { eq } from "drizzle-orm";
import NodeCache from "node-cache";
import * as data from "./data";

const cache = new NodeCache({ stdTTL: 60, checkperiod: 65, maxKeys: 5000 });

export type OperationalCluster = {
  predictiveRetriesEnabled: boolean | null;
  cloudEnabled: boolean | null;
};

export const operationalCluster = async (
  clusterId: string,
): Promise<OperationalCluster> => {
  const cached = cache.get<OperationalCluster>(clusterId);

  if (cached) {
    return cached;
  }

  const results = await data.db
    .select({
      predictiveRetriesEnabled: data.clusters.predictive_retries_enabled,
      cloudEnabled: data.clusters.cloud_enabled,
    })
    .from(data.clusters)
    .where(eq(data.clusters.id, clusterId));

  if (results.length === 0) {
    throw new Error(`Cluster not found: ${clusterId}`);
  }

  cache.set<OperationalCluster>(clusterId, results[0]);

  return results[0];
};

export const getCluster = async (clusterId: string) => {
  const [cluster] = await data.db
    .select({
      id: data.clusters.id,
      apiSecret: data.clusters.api_secret,
    })
    .from(data.clusters)
    .where(eq(data.clusters.id, clusterId));

  if (!cluster) {
    throw new Error(`Cluster not found: ${clusterId}`);
  }

  return cluster;
};
