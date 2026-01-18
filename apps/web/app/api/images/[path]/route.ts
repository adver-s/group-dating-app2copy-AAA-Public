import { NextRequest, NextResponse } from 'next/server'
import { generatePresignedUrl } from '../../../../utils/s3-upload'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string }> }
) {
  try {
    const { path: imagePath } = await params
    
    // ローカル画像の場合は直接返す
    if (imagePath.startsWith('uploads/')) {
      return NextResponse.json({
        success: true,
        imageUrl: `/${imagePath}`
      })
    }
    
    // S3画像の場合は署名付きURLを生成
    const s3Url = `https://${process.env.S3_BUCKET_NAME || 'dating-app-uploads'}.s3.${process.env.AWS_REGION || 'ap-northeast-1'}.amazonaws.com/${imagePath}`
    
    const presignedUrl = await generatePresignedUrl(s3Url, 3600) // 1時間有効
    
    return NextResponse.json({
      success: true,
      imageUrl: presignedUrl
    })
    
  } catch (error) {
    console.error('画像URL生成エラー:', error)
    return NextResponse.json(
      { error: '画像URLの生成に失敗しました' },
      { status: 500 }
    )
  }
}
