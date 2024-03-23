import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client();

export const getPresignedURL = async (
  bucket: string,
  key: string,
): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: "application/zip",
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

export const getObject = async ({
  bucket,
  key,
}: {
  bucket: string;
  key: string;
}): Promise<any> => {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const { Body } = await s3Client.send(command);
  if (!Body) {
    throw new Error("No body in S3 response");
  }
  return Body;
};
