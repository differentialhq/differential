import {
  CloudFormationClient,
  CreateStackCommand,
  DescribeStacksCommand,
  Parameter,
  UpdateStackCommand,
} from "@aws-sdk/client-cloudformation";
import { getObject, CFN_BUCKET } from "../s3";
import { Readable } from "stream";

type CloudFormationStack = {
  stackId: string;
};

type StackChangeResult = CloudFormationStack & {
  pending: boolean;
  success: boolean;
  status: string;
  reason?: string;
};

export class CloudFormationManager {
  private readonly cloudFormationClient: CloudFormationClient;
  private readonly templateBucketName: string;

  constructor() {
    this.cloudFormationClient = new CloudFormationClient();
    if (CFN_BUCKET === undefined) {
      throw new Error("CFN_BUCKET environment variable is not set");
    }
    this.templateBucketName = CFN_BUCKET;
  }

  private async getTemplateBody(templateKey: string): Promise<string> {
    const object = await getObject({
      bucket: this.templateBucketName,
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
    params,
  }: {
    stackName: string;
    templateKey: string;
    params: Parameter[];
  }): Promise<CloudFormationStack> {
    const templateBody = await this.getTemplateBody(templateKey);
    const createStackCommand = new CreateStackCommand({
      StackName: stackName,
      TemplateBody: templateBody,
      Parameters: params,
      OnFailure: "DELETE",
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
    params,
  }: {
    stackName: string;
    templateKey: string;
    params: Parameter[];
  }): Promise<CloudFormationStack> {
    const templateBody = await this.getTemplateBody(templateKey);

    const updateStackCommand = new UpdateStackCommand({
      StackName: stackName,
      TemplateBody: templateBody,
      Parameters: params,
    });

    const response = await this.cloudFormationClient.send(updateStackCommand);
    if (!response.StackId) {
      throw new Error("Failed to update CloudFormation stack");
    }
    return { stackId: response.StackId };
  }

  async getChangeResult(stackId: string): Promise<StackChangeResult> {
    const describeStacksCommand = new DescribeStacksCommand({
      StackName: stackId,
    });

    const response = await this.cloudFormationClient.send(
      describeStacksCommand,
    );
    if (
      response.Stacks &&
      response.Stacks.length > 0 &&
      response.Stacks[0].StackStatus &&
      response.Stacks[0].StackId
    ) {
      switch (response.Stacks[0].StackStatus) {
        case "CREATE_COMPLETE":
        case "UPDATE_COMPLETE":
          return {
            pending: false,
            success: true,
            stackId: response.Stacks[0].StackId,
            status: response.Stacks[0].StackStatus,
          };
        case "CREATE_FAILED":
        case "UPDATE_FAILED":
        case "ROLLBACK_COMPLETE":
        case "ROLLBACK_FAILED":
        case "UPDATE_ROLLBACK_COMPLETE":
        case "UPDATE_ROLLBACK_FAILED":
          return {
            pending: false,
            success: false,
            stackId: response.Stacks[0].StackId,
            status: response.Stacks[0].StackStatus,
            reason: response.Stacks[0].StackStatusReason,
          };
        default:
          return {
            pending: true,
            success: false,
            stackId: response.Stacks[0].StackId,
            status: response.Stacks[0].StackStatus,
          };
      }
    } else {
      throw new Error("Failed to get CloudFormation stack status");
    }
  }
}
