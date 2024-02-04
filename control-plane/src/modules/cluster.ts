import { eq } from "drizzle-orm";
import NodeCache from "node-cache";
import * as data from "./data";

const cache = new NodeCache({ stdTTL: 60, checkperiod: 65, maxKeys: 5000 });

type OperationalCluster = {
  predictiveRetriesEnabled: boolean | null;
};

export const operationalCluster = async (
  clusterId: string,
): Promise<OperationalCluster | null> => {
  const cached = cache.get<OperationalCluster>(clusterId);

  if (cached) {
    return cached;
  }

  const results = await data.db
    .select({
      predictiveRetriesEnabled: data.clusters.predictive_retries_enabled,
    })
    .from(data.clusters)
    .where(eq(data.clusters.id, clusterId));

  if (results.length === 0) {
    return null;
  }

  cache.set<OperationalCluster>(clusterId, results[0]);

  return results[0];
};
