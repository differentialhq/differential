import { and, eq } from "drizzle-orm";
import NodeCache from "node-cache";
import { z } from "zod";
import * as data from "./data";
import { backgrounded } from "./util";

const cache = new NodeCache({
  stdTTL: 5,
  maxKeys: 10000,
});

export type ServiceDefinitionFunction = {
  name: string;
  idempotent?: boolean;
  rate?: {
    per: "minute" | "hour";
    limit: number;
  };
  cacheTTL?: number;
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
          idempotent: z.boolean().optional(),
          rate: z
            .object({
              per: z.enum(["minute", "hour"]),
              limit: z.number(),
            })
            .optional(),
          cacheTTL: z.number().optional(),
        }),
      )
      .optional(),
  }),
);

export const storeServiceDefinitionBG = backgrounded(
  async function storeServiceDefinition(
    service: string,
    definition: ServiceDefinition,
    owner: { clusterId: string },
  ) {
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
  },
);

export async function getServiceDefinitions(owner: { clusterId: string }) {
  if (cache.has(owner.clusterId)) {
    return cache.get<ServiceDefinition[]>(owner.clusterId);
  }

  const serviceDefinitions = await data.db
    .select({
      definition: data.services.definition,
    })
    .from(data.services)
    .where(and(eq(data.services.cluster_id, owner.clusterId)));

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

export const getServiceDefinitionProperty = async <
  T extends keyof ServiceDefinitionFunction,
>(
  owner: { clusterId: string },
  service: string,
  targetFn: string,
  property: T,
): Promise<ServiceDefinitionFunction[T] | undefined> => {
  const defs = await getServiceDefinitions(owner);

  return defs
    ?.find((def) => def.name === service)
    ?.functions?.find((fn) => fn.name === targetFn)?.[property];
};
