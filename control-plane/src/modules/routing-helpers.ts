import { logger } from "../utilities/logger";
import * as management from "./management";
import { and, eq } from "drizzle-orm";
import * as data from "./data";
import Cache from "node-cache";
import * as errors from "../utilities/errors";

const cache = new Cache({ stdTTL: 60, checkperiod: 10, maxKeys: 1000 });

export const validateManagementRequest = async (request: {
  headers: {
    authorization: string;
  };
  params: {
    clusterId: string;
  };
}): Promise<boolean> => {
  return validateManagementAccess({
    authorization: request.headers.authorization,
    clusterId: request.params.clusterId,
  });
};

export const validateManagementAccess = async ({
  authorization,
  clusterId,
}: {
  authorization?: string;
  clusterId: string;
}): Promise<boolean> => {
  if (!authorization) {
    return false;
  }

  const managementToken = authorization.split(" ")[1];

  try {
    const clusterAccess = await management.hasAccessToCluster({
      managementToken,
      clusterId,
    });
    return clusterAccess;
  } catch {
    logger.error("Error validating management token", {
      managementToken,
    });
    return false;
  }
};

export const validateAccessPointAccess = async ({
  clusterId,
  authorization,
}: {
  clusterId: string;
  authorization: string;
}): Promise<{
  allowedServices: string[];
  name: string;
}> => {
  const secret = authorization.split(" ")[1];

  const cached = cache.get<{
    allowedServices: string[];
    name: string;
  }>(secret);

  if (cached) {
    return cached;
  }

  const [accessPoint] = await data.db
    .select({
      name: data.clusterAccessPoints.name,
      allowedServices: data.clusterAccessPoints.allowed_services_csv,
    })
    .from(data.clusterAccessPoints)
    .where(
      and(
        eq(data.clusterAccessPoints.cluster_id, clusterId),
        eq(data.clusterAccessPoints.token, secret),
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

  cache.set<{
    allowedServices: string[];
    name: string;
  }>(secret, {
    allowedServices,
    name: accessPoint.name,
  });

  return {
    allowedServices,
    name: accessPoint.name,
  };
};

export const validateClusterTokenAccess = async (
  authorization: string,
): Promise<{
  organizationId: string | null;
  clusterId: string;
  cloudEnabled: boolean | null;
} | null> => {
  const secret = authorization.split(" ")[1];

  const cached = cache.get<{
    organizationId: string | null;
    clusterId: string;
    cloudEnabled: boolean | null;
  }>(secret);

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

  cache.set<{
    organizationId: string | null;
    clusterId: string;
    cloudEnabled: boolean | null;
  }>(secret, result);

  return result;
};

export const validateAccessPointOrClusterTokenAccess = async (
  authorization: string,
  clusterId: string,
): Promise<{
  clusterId: string;
  allowedServices: string[];
}> => {
  // try to validate as access point token
  const accessPoint = await validateAccessPointAccess({
    clusterId,
    authorization,
  });

  if (accessPoint.name) {
    return {
      clusterId,
      allowedServices: accessPoint.allowedServices,
    };
  }

  // try to validate as cluster token
  const cluster = await validateClusterTokenAccess(authorization);

  if (cluster && cluster.clusterId === clusterId) {
    return {
      clusterId: cluster.clusterId,
      allowedServices: ["*"],
    };
  }

  return {
    clusterId: "",
    allowedServices: [],
  };
};
