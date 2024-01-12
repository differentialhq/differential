import { eq } from "drizzle-orm";
import * as data from "./data";
import jwt from "jsonwebtoken";
import { invariant } from "../utilities/invariant";

const jwtSecret = invariant(
  process.env.JWT_SECRET,
  "JWT_SECRET must be set in .env file"
);

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
  authHeader: string
): Promise<boolean> => {
  const jwtToken = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(jwtToken, jwtSecret);
    return true;
  } catch (err) {
    return false;
  }
};
