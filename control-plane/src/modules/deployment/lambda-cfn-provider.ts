import { ZodSchema, z } from "zod";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import {
  Deployment,
  getAllPendingDeployments,
  s3AssetDetails,
  updateDeploymentResult,
} from "./deployment";
import { DeploymentProvider } from "./deployment-provider";
import { getCluster } from "../cluster";
import { CloudFormationManager } from "./cf-manager";
import {
  AlreadyExistsException,
  Parameter,
} from "@aws-sdk/client-cloudformation";
import { registerCron } from "../cron";

const LAMBDA_CFN_TEMPLATE_KEY = "lambda-cfn.yaml";

export class LambdaCfnProvider implements DeploymentProvider {
  private lambdaClient = new LambdaClient();
  private cfnManager = new CloudFormationManager();

  public name(): string {
    return "lambda";
  }

  public minimumNotificationInterval(): number {
    return 10000;
  }

  // Defaults are currently being set in the CloudFormation template.
  // In the future, we may want to allow these to be overridden by the
  // provider configuration.
  public schema(): ZodSchema<void> {
    return z.void();
  }

  public async create(deployment: Deployment): Promise<any> {
    const functionName = this.buildFunctionName(deployment);

    console.log("Creating new lambda deployment", functionName);

    try {
      await this.cfnManager.create({
        stackName: functionName,
        templateKey: LAMBDA_CFN_TEMPLATE_KEY,
        params: await this.cfnParams(deployment),
      });
    } catch (error: any) {
      if (error instanceof AlreadyExistsException) {
        console.warn("Stack already exists. It will be updated instead.");
        return this.update(deployment);
      }
      throw error;
    }
  }

  public async update(deployment: Deployment): Promise<any> {
    const functionName = this.buildFunctionName(deployment);

    console.log("Updating existing lambda deployment", functionName);
    let status;
    try {
      status = await this.cfnManager.getChangeResult(functionName);
    } catch (error: any) {
      if (error?.message?.includes("does not exist")) {
        console.warn("Stack does not exist. It will be created instead.");
        return this.create(deployment);
      }
      throw error;
    }

    const result = await this.cfnManager.update({
      stackName: functionName,
      templateKey: LAMBDA_CFN_TEMPLATE_KEY,
      params: await this.cfnParams(deployment),
    });
    return result;
  }

  public async notify(
    deployment: Deployment,
    pendingJobs: number,
    runningMachines: number,
  ): Promise<any> {
    const functionName = this.buildFunctionName(deployment);

    // TODO: This should actually evaluate the number of running instances
    // and determine how many more are needed to handle the pending jobs.
    // For now, we'll just trigger a new instance if none are running.
    if (runningMachines > 0) {
      return;
    }

    try {
      console.log("Triggering lambda", {
        functionName,
        pendingJobs,
        runningMachines,
      });

      await this.lambdaClient.send(
        new InvokeCommand({
          InvocationType: "Event",
          FunctionName: functionName,
        }),
      );
    } catch (error: any) {
      console.error("Failed to trigger lambda", functionName, error);
    }
  }

  // Scheduled job which checks for pending deployments and updates their status based on the result of the CloudFormation stack
  public async startPollingDeployments() {
    registerCron(
      async () => {
        const deployments = await getAllPendingDeployments("lambda");
        for (const deployment of deployments) {
          const result = await this.cfnManager.getChangeResult(
            this.buildFunctionName(deployment),
          );
          // TODO: Cleanup pending deployments that have stalled
          if (result.pending) {
            continue;
          }
          console.log("Updating deployment with CFN result", {
            deployment,
            result,
          });
          await updateDeploymentResult(
            deployment,
            result.success ? "active" : "failed",
            result,
          );
        }
      },
      { interval: 5000 },
    );
  }

  private async cfnParams(deployment: Deployment): Promise<Parameter[]> {
    const functionName = this.buildFunctionName(deployment);
    const asset = await s3AssetDetails(deployment);
    const cluster = await getCluster(deployment.clusterId);

    return [
      { ParameterKey: "ClusterId", ParameterValue: deployment.clusterId },
      { ParameterKey: "DeploymentId", ParameterValue: deployment.id },
      { ParameterKey: "ServiceName", ParameterValue: deployment.service },
      { ParameterKey: "FunctionName", ParameterValue: functionName },
      { ParameterKey: "UploadBucketName", ParameterValue: asset.S3Bucket },
      { ParameterKey: "UploadBucketKey", ParameterValue: asset.S3Key },
      { ParameterKey: "APISecret", ParameterValue: cluster.apiSecret },
    ];
  }
  private buildFunctionName(deployment: Deployment): string {
    return `differential-deployment-${deployment.clusterId}-${deployment.service}`;
  }
}
