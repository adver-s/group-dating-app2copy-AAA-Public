import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { executeQuery } from '@/utils/database';

// S3クライアントの初期化
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// S3設定の確認
console.log('🔍 S3設定確認:', {
  region: process.env.AWS_REGION || 'ap-northeast-1',
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
  bucketName: 'dating-app-team-photos'
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;
    const { fileName, fileType } = await req.json();

    console.log('🔍 チーム画像アップロード開始:', {
      teamId,
      fileName,
      fileType
    })

    if (!fileName || !fileType) {
      console.error('❌ 必要なパラメータが不足:', { fileName, fileType })
      return NextResponse.json(
        { error: 'fileName and fileType are required' },
        { status: 400 }
      );
    }

    // 開発環境ではプレースホルダー画像を使用
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

    if (isDevelopment && !hasAwsCredentials) {
      console.log('🔧 開発環境: AWS認証情報がないため、プレースホルダー画像を使用')
      
      // プレースホルダー画像URLを生成
      const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileUrl = `https://via.placeholder.com/400x300/cccccc/666666?text=Team+Photo+${photoId}`;
      
      // データベースに画像情報を保存
      await executeQuery(`
        INSERT INTO team_photos (
          id, team_id, photo_url, display_order, status, updated_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        photoId,
        teamId,
        fileUrl,
        0, // デフォルトの表示順序
        'active', // 開発環境では即座にアクティブ
      ]);

      console.log('✅ プレースホルダー画像保存完了')
      return NextResponse.json({
        success: true,
        photoId,
        fileUrl,
        uploadUrl: null, // S3アップロードは不要
        fileKey: null,
        moderationResult: null,
        isApproved: true,
      });
    }

    // 本番環境またはAWS認証情報がある場合のS3アップロード
    const bucketName = 'dating-app-team-photos';
    const fileKey = `teams/${teamId}/${fileName}`;

    console.log('🔍 S3設定:', {
      bucketName,
      fileKey,
      region: process.env.AWS_REGION || 'ap-northeast-1'
    })

    // S3アップロード用の署名付きURLを生成
    const putObjectCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: fileType,
    });

    console.log('🔍 署名付きURL生成中...')
    const signedUrl = await getSignedUrl(s3Client, putObjectCommand, {
      expiresIn: 3600, // 1時間
    });

    const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-northeast-1'}.amazonaws.com/${fileKey}`;

    console.log('✅ 署名付きURL生成成功:', {
      signedUrl: signedUrl.substring(0, 100) + '...',
      fileUrl
    })

    // データベースに画像情報を保存（審査待ち状態）
    const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🔍 データベースに画像情報を保存中...')
    await executeQuery(`
      INSERT INTO team_photos (
        id, team_id, photo_url, display_order, updated_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      photoId,
      teamId,
      fileUrl,
      0, // デフォルトの表示順序
    ]);

    console.log('✅ データベース保存成功')

    // 画像アップロード後に自動審査を実行
    const moderationResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/photos/moderate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: fileUrl,
        bucketName,
        imageKey: fileKey,
        photoId,
      }),
    });

    let moderationResult = null;
    if (moderationResponse.ok) {
      moderationResult = await moderationResponse.json();
    }

    console.log('✅ 画像アップロード処理完了')
    return NextResponse.json({
      success: true,
      photoId,
      fileUrl,
      uploadUrl: signedUrl,
      fileKey: fileKey,
      moderationResult: moderationResult?.result || null,
      isApproved: moderationResult?.result?.isApproved ?? true, // 審査失敗時はデフォルトで承認
    });

  } catch (error) {
    console.error('❌ 画像アップロードエラー:', error);
    return NextResponse.json(
      { error: `Failed to generate upload URL: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// チームの画像一覧を取得
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;
    const { searchParams } = new URL(req.url);
    const includePending = searchParams.get('includePending') === 'true';

    // team_photosテーブルにはstatusカラムがないため、すべての画像を取得
    const photos = await executeQuery(`
      SELECT id, photo_url, display_order, created_at
      FROM team_photos
      WHERE team_id = ?
      ORDER BY display_order ASC, created_at ASC
    `, [teamId]);

    // フロントエンドが期待する形式に変換
    const formattedPhotos = photos.map((photo: any) => ({
      ...photo,
      status: 'active', // デフォルトでactive
      moderationResult: null
    }));

    return NextResponse.json(formattedPhotos);
  } catch (error) {
    console.error('Failed to fetch team photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
} 