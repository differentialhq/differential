import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const UPLOAD_BUCKET = process.env.UPLOAD_BUCKET;

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

export const streamFile = async (bucket: string, key: string): Promise<any> => {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const { Body } = await s3Client.send(command);
  if (!Body) {
    throw new Error("No body in the response from S3");
  }
  // return a Buffer
  return Body;
};
