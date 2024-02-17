import { eq } from "drizzle-orm";
import * as data from "./data";

export const jobOwnerHash = async (authHeader: string) => {
  const secret = authHeader.split(" ")[1];

  const result = await data.db
    .select({
      organizationId: data.clusters.organization_id,
      clusterId: data.clusters.id,
    })
    .from(data.clusters)
    .where(eq(data.clusters.api_secret, secret));

  if (result.length === 0) {
    return null;
  }

  return {
    organizationId: result[0].organizationId,
    clusterId: result[0].clusterId,
  };
};

export const machineAuthSuccess = async (
  authHeader: string,
): Promise<boolean> => {
  throw new Error("Deprecated");
};
