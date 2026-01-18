import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()
    
    if (!imageUrl) {
      console.error('❌ 画像URLが提供されていません');
      return NextResponse.json({ error: '画像URLが必要です' }, { status: 400 })
    }

    console.log('🔍 S3署名付きURL生成開始:', imageUrl.substring(0, 100) + '...');

    // S3 URLの形式をチェック（より柔軟に）
    if (!imageUrl.includes('s3.') || !imageUrl.includes('amazonaws.com')) {
      console.error('❌ S3 URLではありません:', imageUrl);
      return NextResponse.json({ error: 'S3 URLではありません' }, { status: 400 })
    }

    // S3 URLからバケット名とキーを抽出
    const urlParts = imageUrl.split('/')
    console.log('🔍 URL解析:', { urlParts: urlParts.slice(0, 5) });
    
    // https://bucket.s3.region.amazonaws.com/key の形式
    const bucketName = urlParts[2].split('.')[0] // s3.region.amazonaws.comの前の部分
    const key = urlParts.slice(3).join('/')

    console.log('🔍 S3署名付きURL生成:', { 
      bucketName, 
      key,
      region: process.env.AWS_REGION || 'ap-northeast-1',
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
    })

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    })

    const presignedUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600 // 1時間有効
    })

    console.log('✅ 署名付きURL生成成功:', presignedUrl.substring(0, 100) + '...');

    return NextResponse.json({
      success: true,
      presignedUrl
    })

  } catch (error) {
    console.error('❌ 署名付きURL生成エラー:', error)
    return NextResponse.json(
      { error: '署名付きURLの生成に失敗しました' },
      { status: 500 }
    )
  }
}
