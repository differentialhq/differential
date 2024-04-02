import {
  CloudFormationClient,
  CreateStackCommand,
  DescribeStacksCommand,
  Parameter,
  UpdateStackCommand,
} from "@aws-sdk/client-cloudformation";
import { getObject } from "../s3";
import { Readable } from "stream";
import { env } from "../../utilities/env";

type CloudFormationStack = {
  stackId: string;
};

type StackChangeResult = CloudFormationStack & {
  pending: boolean;
  success: boolean;
  status: string;
  reason?: string;
  // Used to match the event with a deployment
  clientRequestToken: string;
};

export class CloudFormationManager {
  private readonly cloudFormationClient: CloudFormationClient;

  constructor() {
    this.cloudFormationClient = new CloudFormationClient();
  }

  private async getTemplateBody(templateKey: string): Promise<string> {
    if (env.DEPLOYMENT_TEMPLATE_BUCKET === undefined) {
      throw new Error("CFN_BUCKET environment variable is not set");
    }
    const object = await getObject({
      bucket: env.DEPLOYMENT_TEMPLATE_BUCKET,
      key: templateKey,
    });

    let templateBody = "";
    if (object instanceof Readable) {
      for await (const chunk of object) {
        templateBody += chunk;
      }
    } else {
      throw new Error("Unexpected response format from S3");
    }

    return templateBody;
  }

  async create({
    stackName,
    templateKey,
    clientRequestToken,
    params,
  }: {
    stackName: string;
    templateKey: string;
    clientRequestToken: string;
    params: Parameter[];
  }): Promise<CloudFormationStack> {
    if (env.DEPLOYMENT_SNS_TOPIC === undefined) {
      throw new Error("DELOYMENT_SNS_TOPIC environment variable is not set");
    }
    const templateBody = await this.getTemplateBody(templateKey);
    const createStackCommand = new CreateStackCommand({
      StackName: stackName,
      TemplateBody: templateBody,
      Parameters: params,
      OnFailure: "DELETE",
      NotificationARNs: [env.DEPLOYMENT_SNS_TOPIC],
      ClientRequestToken: clientRequestToken,
      RoleARN: env.DEPLOYMENT_DEFAULT_SERVICE_ROLE,
    });

    const response = await this.cloudFormationClient.send(createStackCommand);
    if (!response.StackId) {
      throw new Error("Failed to create CloudFormation stack");
    }
    return { stackId: response.StackId };
  }

  async update({
    stackName,
    templateKey,
    clientRequestToken,
    params,
  }: {
    stackName: string;
    templateKey: string;
    clientRequestToken: string;
    params: Parameter[];
  }): Promise<CloudFormationStack> {
    if (env.DEPLOYMENT_SNS_TOPIC === undefined) {
      throw new Error("DELOYMENT_SNS_TOPIC environment variable is not set");
    }
    const templateBody = await this.getTemplateBody(templateKey);

    const updateStackCommand = new UpdateStackCommand({
      StackName: stackName,
      TemplateBody: templateBody,
      Parameters: params,
      NotificationARNs: [env.DEPLOYMENT_SNS_TOPIC],
      ClientRequestToken: clientRequestToken,
      RoleARN: env.DEPLOYMENT_DEFAULT_SERVICE_ROLE,
    });

    const response = await this.cloudFormationClient.send(updateStackCommand);
    if (!response.StackId) {
      throw new Error("Failed to update CloudFormation stack");
    }
    return { stackId: response.StackId };
  }

  async stackExists(stackName: string): Promise<boolean> {
    try {
      const describeStacksCommand = new DescribeStacksCommand({
        StackName: stackName,
      });
      const result = await this.cloudFormationClient.send(
        describeStacksCommand,
      );
      return result.Stacks?.length === 1;
    } catch (error: any) {
      if (error?.message?.includes("does not exist")) {
        return false;
      }
      throw error;
    }
  }
}

export const deploymentResultFromNotification = (
  notification: Record<string, string>,
): StackChangeResult => {
  const {
    ResourceStatus: status,
    StackId: stackId,
    ResourceStatusReason: reason,
    ClientRequestToken: clientRequestToken,
  } = notification;

  if (!status || !stackId) {
    throw new Error("Invalid SNS notification");
  }

  if (!clientRequestToken) {
    throw new Error("ClientRequestToken not found in SNS notification");
  }

  switch (status) {
    case "CREATE_COMPLETE":
    case "UPDATE_COMPLETE":
      return {
        pending: false,
        success: true,
        stackId,
        status,
        clientRequestToken,
      };
    case "UPDATE_ROLLBACK_FAILED":
    case "ROLLBACK_FAILED":
    case "UPDATE_ROLLBACK_COMPLETE":
    case "DELETE_COMPLETE":
      return {
        pending: false,
        success: false,
        stackId,
        status,
        reason,
        clientRequestToken,
      };
    default:
      return {
        pending: true,
        success: false,
        stackId,
        status,
        reason,
        clientRequestToken,
      };
  }
};
