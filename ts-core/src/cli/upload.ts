import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import debug from "debug";
import { createReadStream } from "fs";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import axios from "axios";

const log = debug("differential:cli:aws");

export const getPresignedURL = async (
  cluster: string,
  service: string,
  key: string,
): Promise<string> => {
  const AWS_REGION = "ap-southeast-2";
  const BUCKET_NAME = "john-test-lambda-upload";
  log("Generating presigned URL", { cluster, service, key });
  const s3Client = new S3Client({ region: AWS_REGION });

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `${cluster}/${service}/${key}`,
    ContentType: "application/zip",
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};
export const uploadPackage = async (
  url: string,
  packagePath: string,
): Promise<void> => {
  log("Uploading package", { url, packagePath });
  const response = await axios.put(
    url,
    {
      data: createReadStream(packagePath),
    },
    {
      headers: {
        "Content-Type": "application/zip",
      },
    },
  );

  if (response.status !== 200) {
    throw new Error(`Failed to upload file. Status code: ${response.status}`);
  }
};
