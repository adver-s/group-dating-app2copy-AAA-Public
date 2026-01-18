import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3クライアントの初期化
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, fileType, userId } = body;
    
    if (!fileName || !fileType || !userId) {
      return NextResponse.json(
        { error: 'fileName, fileType, userId are required' },
        { status: 400 }
      );
    }

    // S3バケット名
    const bucketName = 'dating-app-user-avatars';
    
    // ファイルキーの生成
    const fileKey = `avatars/${userId}/${fileName}`;

    // 署名付きURLの生成（アップロード用）
    const putObjectCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3Client, putObjectCommand, {
      expiresIn: 3600, // 1時間
    });

    // アップロード後のURL
    const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-northeast-1'}.amazonaws.com/${fileKey}`;

    return NextResponse.json({
      uploadUrl: signedUrl,
      fileUrl: fileUrl,
      fileKey: fileKey,
    });
  } catch (error) {
    console.error('S3 upload error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // ユーザーのアバター一覧を取得（実装は後で追加）
    return NextResponse.json({
      avatars: []
    });
  } catch (error) {
    console.error('S3 get avatars error:', error);
    return NextResponse.json(
      { error: 'Failed to get avatars' },
      { status: 500 }
    );
  }
} 