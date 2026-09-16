import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const getClient = () =>
  new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
  });

const BUCKET = process.env.R2_BUCKET || "formium";

export async function createUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600,
) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getClient(), command, { expiresIn });
}

export async function deleteUploadedFile(key: string) {
  if (!key) return;
  try {
    await getClient().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    console.error("Failed to delete R2 object:", err);
  }
}

export function fileKeyToPublicUrl(key: string) {
  const base = process.env.R2_PUBLIC_URL || process.env.R2_ENDPOINT || "";
  if (!base) return key;
  return `${base.replace(/\/$/, "")}/${key}`;
}

// Make sure R2 is configured before attempting uploads
export const isUploadConfigured = () =>
  Boolean(
    process.env.R2_ENDPOINT &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  );