import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function uploadToS3(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const bucketName = process.env.AWS_S3_BUCKET_NAME!

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: buffer,
    ContentType: contentType,
    ACL: 'private', // プライベートアクセス
  })

  await s3Client.send(command)

  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`
} 