import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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
