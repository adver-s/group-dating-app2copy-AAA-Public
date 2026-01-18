import { NextRequest, NextResponse } from 'next/server';
import { RekognitionClient, DetectModerationLabelsCommand } from '@aws-sdk/client-rekognition';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { executeQuery } from '../../../../utils/database';

// AWSクライアントの初期化
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, bucketName, imageKey, photoId } = await req.json();
    
    if (!imageUrl || !bucketName || !imageKey) {
      return NextResponse.json(
        { error: 'imageUrl, bucketName, imageKey are required' },
        { status: 400 }
      );
    }

    // Rekognition Moderationで審査
    const moderationCommand = new DetectModerationLabelsCommand({
      Image: {
        S3Object: {
          Bucket: bucketName,
          Name: imageKey,
        },
      },
      MinConfidence: 70, // 70%以上の信頼度で判定
    });

    const moderationResult = await rekognitionClient.send(moderationCommand);
    
    // 審査結果の分析
    const moderationLabels = moderationResult.ModerationLabels || [];
    const isInappropriate = moderationLabels.length > 0;
    
    // 詳細な審査結果
    const reviewResult = {
      isApproved: !isInappropriate,
      confidence: moderationLabels.length > 0 ? moderationLabels[0].Confidence : 100,
      labels: moderationLabels.map(label => ({
        name: label.Name,
        confidence: label.Confidence,
        parentName: label.ParentName,
      })),
      reasons: moderationLabels.map(label => label.Name).join(', '),
    };

    // データベースに審査結果を保存
    if (photoId) {
      await saveModerationResult(photoId, reviewResult);
    }

    return NextResponse.json({
      success: true,
      result: reviewResult,
    });

  } catch (error) {
    console.error('Moderation error:', error);
    return NextResponse.json(
      { error: 'Failed to moderate image' },
      { status: 500 }
    );
  }
}

// 審査結果をデータベースに保存
async function saveModerationResult(photoId: string, result: any) {
  try {
    await executeQuery(`
      UPDATE team_photos 
      SET moderation_result = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      JSON.stringify(result),
      result.isApproved ? 'active' : 'rejected',
      photoId
    ]);
  } catch (error) {
    console.error('Failed to save moderation result:', error);
  }
} 