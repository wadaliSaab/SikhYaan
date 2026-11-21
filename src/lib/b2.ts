import { S3Client,
  GetObjectCommand,
  PutObjectCommand, 
  HeadObjectCommand,
  DeleteObjectCommand,} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = process.env.B2_BUCKET!;

const client = new S3Client({
  endpoint: process.env.B2_ENDPOINT!,
  region: process.env.B2_REGION!,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});


export function presignUpload(key: string, contentType: string) {
  return getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn: 1000 }
  );
}


export function presignGet(key: string) {
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: 3600,
  });
}


export async function headFile(key: string) {
  const res = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  return { size: res.ContentLength ?? 0, mimeType: res.ContentType ?? "" };
}

export async function deleteFile(key: string) {
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}


export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string,
) {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}