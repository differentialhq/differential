import { and, eq } from "drizzle-orm";
import * as data from "./data";
import Cache from "node-cache";
import * as errors from "../utilities/errors";

type Cluster = {
  organizationId: string | null;
  clusterId: string;
  cloudEnabled: boolean | null;
};

const cache = new Cache({ stdTTL: 60, checkperiod: 10, maxKeys: 1000 });

export const jobOwnerHash = async (
  authHeader: string,
): Promise<Cluster | null> => {
  const secret = authHeader.split(" ")[1];

  const cached = cache.get<Cluster>(secret);

  if (cached) {
    return cached;
  }

  const [cluster] = await data.db
    .select({
      organizationId: data.clusters.organization_id,
      clusterId: data.clusters.id,
      cloudEnabled: data.clusters.cloud_enabled,
    })
    .from(data.clusters)
    .where(eq(data.clusters.api_secret, secret));

  if (!cluster) {
    return null;
  }

  const result = {
    organizationId: cluster.organizationId,
    clusterId: cluster.clusterId,
    cloudEnabled: cluster.cloudEnabled,
  };

  cache.set<Cluster>(secret, result);

  return result;
};

export const accessPointServices = async ({
  clusterId,
  token,
}: {
  clusterId: string;
  token: string;
}): Promise<{
  allowedServices: string[];
  name: string;
}> => {
  const [accessPoint] = await data.db
    .select({
      name: data.clusterAccessPoints.name,
      allowedServices: data.clusterAccessPoints.allowed_services_csv,
    })
    .from(data.clusterAccessPoints)
    .where(
      and(
        eq(data.clusterAccessPoints.cluster_id, clusterId),
        eq(data.clusterAccessPoints.token, token),
      ),
    );

  if (!accessPoint) {
    return {
      allowedServices: [],
      name: "",
    };
  }

  const allowedServices = accessPoint.allowedServices
    .split(",")
    .map((s) => s.trim());

  return {
    allowedServices,
    name: accessPoint.name,
  };
};
