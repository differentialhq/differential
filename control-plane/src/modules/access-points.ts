import { and, eq } from "drizzle-orm";
import * as data from "./data";
import * as errors from "../utilities/errors";

export const routeToServiceFunction = async ({
  clusterId,
  service,
  targetFn,
  targetArgs,
  token,
  name,
}: {
  clusterId: string;
  service: string;
  targetFn: string;
  targetArgs: any;
  token: string;
  name: string;
}) => {
  const [accessPoint] = await data.db
    .select({
      allowedServices: data.clusterAccessPoints.allowed_services_csv,
    })
    .from(data.clusterAccessPoints)
    .where(
      and(
        eq(data.clusterAccessPoints.cluster_id, clusterId),
        eq(data.clusterAccessPoints.name, name),
      ),
    );

  if (!accessPoint) {
    throw new errors.NotFoundError("Access point not found");
  }

  const allowedServices = accessPoint.allowedServices
    .split(",")
    .map((s) => s.trim());

  const hasAccessToService =
    allowedServices.includes("*") || allowedServices.includes(service);
};
