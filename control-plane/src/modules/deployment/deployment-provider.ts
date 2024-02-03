import { ZodSchema } from "zod";
import { Deployment } from "./deployment";
import * as data from "../data";
import { eq } from "drizzle-orm";

export const fetchConfig = async (
  provider: DeploymentProvider,
): Promise<any> => {
  const config = await data.db
    .select({
      config: data.deploymentProvividerConfig.config,
    })
    .from(data.deploymentProvividerConfig)
    .where(eq(data.deploymentProvividerConfig.provider, provider.name()));

  if (config.length === 0) {
    throw new Error(`No configuration found for provider ${provider.name()}`);
  }

  return provider.schema().parse(config[0].config);
};

export interface DeploymentProvider {
  name: () => string;
  schema: () => ZodSchema;
  create: (deployment: Deployment) => Promise<any>;
  update: (deployment: Deployment) => Promise<any>;
}
