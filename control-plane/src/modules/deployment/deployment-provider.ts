import { ZodSchema } from "zod";
import { Deployment } from "./deployment";
import * as data from "../data";
import { eq } from "drizzle-orm";
import { MockProvider } from "./mock-deployment-provider";
import { LambdaCfnProvider } from "./lambda-cfn-provider";

const mockProvider = new MockProvider();
const lambdaProvider = new LambdaCfnProvider();

export const getDeploymentProvider = (provider: string): DeploymentProvider => {
  switch (provider) {
    case "lambda":
      return lambdaProvider;
    case "mock":
      return mockProvider;
    default:
      throw new Error(`Unknown provider ${provider}`);
  }
};

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
  // Create a new deployment
  create: (deployment: Deployment) => Promise<any>;
  // Update an existing deployment
  update: (deployment: Deployment) => Promise<any>;
  // Notify the provider of a a new job
  notify: (
    deployment: Deployment,
    pendingJobs: number,
    runningMachines: number,
  ) => Promise<any>;
  // How frequently the provider should be notified of new jobs
  minimumNotificationInterval: () => number;
}
