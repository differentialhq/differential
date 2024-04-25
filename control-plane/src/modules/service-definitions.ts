import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import NodeCache from "node-cache";
import { z } from "zod";
import * as data from "./data";

const cache = new NodeCache({
  stdTTL: 5,
  maxKeys: 10000,
});

export type ServiceDefinitionFunction = {
  name: string;
};

export type ServiceDefinition = {
  name: string;
  functions?: Array<ServiceDefinitionFunction>;
};

export const serviceDefinitionsSchema = z.array(
  z.object({
    name: z.string(),
    functions: z
      .array(
        z.object({
          name: z.string(),
        }),
      )
      .optional(),
  }),
);

export async function storeServiceDefinition(
  service: string,
  definition: ServiceDefinition,
  owner: { clusterId: string },
) {
  const definitionSha = crypto
    .createHash("sha256")
    .update(JSON.stringify(definition))
    .digest("hex");
  const key = `${service}-${owner.clusterId}`;

  if (cache.get(key) === definitionSha) {
    return;
  }

  await data.db
    .insert(data.services)
    .values({
      service,
      definition,
      cluster_id: owner.clusterId,
    })
    .onConflictDoUpdate({
      target: [data.services.service, data.services.cluster_id],
      set: {
        definition,
      },
    });

  cache.set(key, definitionSha);
}

export async function getServiceDefinitions(owner: { clusterId: string }) {
  if (cache.has(owner.clusterId)) {
    return cache.get<ServiceDefinition[]>(owner.clusterId);
  }

  const serviceDefinitions = await data.db
    .select({
      definition: data.services.definition,
    })
    .from(data.services)
    .where(and(eq(data.services.cluster_id, owner.clusterId)))
    .limit(1);

  if (serviceDefinitions.length === 0) {
    return [];
  }

  const retrieved = serviceDefinitionsSchema.parse([
    serviceDefinitions[0]?.definition,
  ]);

  cache.set(owner.clusterId, retrieved);

  return retrieved;
}

export const parseServiceDefinition = (
  input: unknown[],
): ServiceDefinition[] => {
  if (!input || input.filter((i) => i).length === 0) {
    return [];
  }

  return input ? serviceDefinitionsSchema.parse(input) : [];
};
