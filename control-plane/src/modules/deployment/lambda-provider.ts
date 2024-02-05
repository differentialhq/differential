import { ZodSchema, z } from "zod";
import {
  CreateFunctionCommand,
  CreateFunctionCommandOutput,
  CreateFunctionRequest,
  LambdaClient,
  UpdateFunctionCodeCommand,
} from "@aws-sdk/client-lambda";
import { Deployment, s3AssetDetails } from "./deployment";
import { DeploymentProvider, fetchConfig } from "./deployment-provider";

type LambdaProviderConfig = Pick<
  CreateFunctionRequest,
  "Role" | "Handler" | "Runtime" | "Timeout"
>;

export class LambdaProvider implements DeploymentProvider {
  public name(): string {
    return "lambda";
  }

  public schema(): ZodSchema<LambdaProviderConfig> {
    return z.object({
      Role: z.string(),
      Handler: z.string().default("index.handler"),
      Runtime: z.enum(["nodejs20.x"]).default("nodejs20.x"),
      Timeout: z.number().default(60),
    });
  }

  public async create(
    deployment: Deployment,
  ): Promise<CreateFunctionCommandOutput> {
    const config = await this.config();
    const functionName = this.buildFunctionName(deployment);
    const lambdaClient = new LambdaClient();

    console.log("Creating new lambda", functionName);

    try {
      return await lambdaClient.send(
        new CreateFunctionCommand({
          ...config,
          Tags: {
            clusterId: deployment.clusterId,
            service: deployment.service,
          },
          Publish: true,
          FunctionName: functionName,
          Code: {
            ...s3AssetDetails(deployment),
          },
        }),
      );
    } catch (error: any) {
      if (error.name === "ResourceConflictException") {
        throw new Error(
          `${functionName} service has already been created. It should be updated instead.`,
        );
      }

      throw error;
    }
  }

  public async update(deployment: Deployment): Promise<any> {
    const functionName = this.buildFunctionName(deployment);
    const lambdaClient = new LambdaClient();

    console.log("Updating existing lambda", functionName);

    try {
      return await lambdaClient.send(
        new UpdateFunctionCodeCommand({
          FunctionName: functionName,
          Publish: true,
          ...s3AssetDetails(deployment),
        }),
      );
    } catch (error: any) {
      if (error.name === "ResourceNotFoundException") {
        throw new Error(
          `${functionName} is not available. It has likely been deleted.`,
        );
      }

      throw error;
    }
  }

  private async config(): Promise<LambdaProviderConfig> {
    return await fetchConfig(this);
  }

  private buildFunctionName(deployment: Deployment): string {
    return `${deployment.clusterId}-${deployment.service}`;
  }
}
