import { ConfirmSubscriptionCommand, SNSClient } from "@aws-sdk/client-sns";
import MessageValidator from "sns-validator";

export const DELOYMENT_SNS_TOPIC = process.env.DELOYMENT_SNS_TOPIC;

const validator = new MessageValidator();
const sns = new SNSClient();

// "'stackId'='XXXX'\n";
export const parseCloudFormationMessage = (notification: string) =>
  notification
    .replace(/"/g, "")
    .replace(/'/g, "")
    .split("\n")
    .reduce(
      (acc, line) => {
        const [key, value] = line.split("=");
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>,
    );

export const confirmSubscription = async (options: {
  Token: string;
  TopicArn: string;
}) => {
  await sns.send(new ConfirmSubscriptionCommand(options));
};

export const validateSignature = async (
  message: Record<string, unknown>,
): Promise<boolean> => {
  return new Promise((resolve, reject) =>
    validator.validate(message, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    }),
  );
};
