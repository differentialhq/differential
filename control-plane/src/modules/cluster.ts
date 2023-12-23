import crypto from "crypto";
import { eq } from "drizzle-orm";
import * as data from "./data";
import { ExternalError } from "./errors";
import { randomName } from "./names";

type ServiceDefinition = {
  name: string;
  functions: {
    [key: string]: {
      name: string;
      description: string | null;
    };
  };
};

export const createCluster = async ({
  organizationId,
}: {
  organizationId: string;
}) => {
  const created = await data.db
    .insert(data.clusters)
    .values([
      {
        id: `cluster-${randomName("-")}-${crypto
          .randomBytes(5)
          .toString("hex")}`,
        organization_id: organizationId,
        api_secret: `sk_${crypto.randomBytes(32).toString("hex")}`,
      },
    ])
    .returning({
      id: data.clusters.id,
      apiSecret: data.clusters.api_secret,
      organizationId: data.clusters.organization_id,
    });

  return created[0];
};

// TODO: type the object with the client sdk schema
export const registerServiceDefinitionForCluster = async (
  clusterId: string,
  serviceDefinition: ServiceDefinition
): Promise<void> => {
  console.log("Persisting service definition", serviceDefinition);

  const result = await data.db
    .update(data.clusters)
    .set({
      service_definition: serviceDefinition,
    })
    .where(eq(data.clusters.id, clusterId));

  if (result.rowCount === 0) {
    throw new ExternalError("Cluster not found");
  }
};

export const getServiceDefinitionForCluster = async (
  clusterId: string
): Promise<ServiceDefinition | undefined> => {
  const cluster = (
    await data.db
      .select({
        service_definition: data.clusters.service_definition,
      })
      .from(data.clusters)
      .where(eq(data.clusters.id, clusterId))
  )[0];

  return cluster?.service_definition as ServiceDefinition;
};
