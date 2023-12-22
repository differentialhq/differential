import { z } from "zod";
import { clusters, db } from "./data";
import { eq } from "drizzle-orm";

type ServiceDefinition = {
  name: string;
  functions: {
    [key: string]: {
      name: string;
      description: string | null;
      cacheKeyGenerator: string | null;
    };
  };
};

// TODO: type the object with the client sdk schema
export const registerServiceDefinitionForCluster = async (
  clusterId: string,
  serviceDefinition: ServiceDefinition
): Promise<void> => {
  console.log("Persisting service definition", serviceDefinition);

  await db
    .update(clusters)
    .set({
      service_definition: serviceDefinition,
    })
    .where(eq(clusters.id, clusterId));
};

export const getServiceDefinitionForCluster = async (
  clusterId: string
): Promise<ServiceDefinition | undefined> => {
  const cluster = (
    await db
      .select({
        service_definition: clusters.service_definition,
      })
      .from(clusters)
      .where(eq(clusters.id, clusterId))
  )[0];

  return cluster?.service_definition as ServiceDefinition;
};
