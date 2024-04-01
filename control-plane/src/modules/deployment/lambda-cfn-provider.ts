import { ZodSchema, z } from "zod";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { Deployment, s3AssetDetails } from "./deployment";
import { DeploymentProvider } from "./deployment-provider";
import { getCluster } from "../cluster";
import { CloudFormationManager } from "./cfn-manager";
import {
  AlreadyExistsException,
  Parameter,
} from "@aws-sdk/client-cloudformation";
import { logger } from "../../utilities/logger";

import {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

const LAMBDA_CFN_TEMPLATE_KEY = "lambda-cfn.yaml";

export class LambdaCfnProvider implements DeploymentProvider {
  private lambdaClient = new LambdaClient();
  private cfnManager = new CloudFormationManager();
  private cloudWatchClient = new CloudWatchLogsClient();

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

    logger.info("Creating new lambda deployment", {
      deploymentId: deployment.id,
      functionName,
    });

    try {
      return await this.cfnManager.create({
        stackName: functionName,
        templateKey: LAMBDA_CFN_TEMPLATE_KEY,
        clientRequestToken: deployment.id,
        params: await this.cfnParams(deployment),
      });
    } catch (error: any) {
      if (error instanceof AlreadyExistsException) {
        logger.warn("Stack already exists. It will be updated instead.");
        return this.update(deployment);
      }
      throw error;
    }
  }

  public async update(deployment: Deployment): Promise<any> {
    const functionName = this.buildFunctionName(deployment);

    logger.info("Updating existing lambda deployment", {
      deploymentId: deployment.id,
      functionName,
    });

    const exists = await this.cfnManager.stackExists(functionName);
    if (!exists) {
      logger.warn("Stack does not exist. It will be created instead.");
      return this.create(deployment);
    }

    const result = await this.cfnManager.update({
      stackName: functionName,
      templateKey: LAMBDA_CFN_TEMPLATE_KEY,
      clientRequestToken: deployment.id,
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
      logger.info("Triggering lambda", {
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

  public async getLogs(
    deployment: Deployment,
    options: {
      start?: Date;
      end?: Date;
      next?: string;
      filter?: string;
    } = {},
  ): Promise<{ message: string }[]> {
    const logGroupName = `/aws/lambda/${this.buildFunctionName(deployment)}`;

    // TODO: Exclude these as part of the query
    const excludePattern = new RegExp(
      "^START|^INIT_START|^END|^REPORT|Task timed out after",
    );

    const request = new FilterLogEventsCommand({
      startTime: options.start?.getTime(),
      endTime: options.end?.getTime(),
      nextToken: options.next,
      filterPattern: options.filter ?? undefined,
      logGroupName,
      limit: 1000,
    });

    try {
      const reponse = await this.cloudWatchClient.send(request);
      return (
        (reponse.events
          ?.map((event) => {
            return {
              message: event.message?.replace(/[\n\r]/g, ""),
            };
          })
          .filter((event) => {
            if (event.message == undefined) {
              return false;
            }
            return !excludePattern.test(event.message);
          }) as { message: string }[]) ?? []
      );
    } catch (error: any) {
      logger.error("Failed to get CloudWatch logs", {
        deploymentId: deployment.id,
        error: error,
      });
      return [];
    }
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
