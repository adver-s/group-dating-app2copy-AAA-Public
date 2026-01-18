import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// S3クライアントの初期化
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

// バケット名の設定
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'dating-app-uploads'

/**
 * 画像をS3にアップロード
 */
export async function uploadImageToS3(
  imageBuffer: Buffer,
  fileName: string,
  folder: string = 'verification'
): Promise<string> {
  try {
    // AWS認証情報の確認
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS認証情報が設定されていません')
    }

    const key = `${folder}/${Date.now()}_${fileName}`
    
    console.log('S3アップロード開始:', {
      bucket: BUCKET_NAME,
      key: key,
      size: imageBuffer.length,
      region: process.env.AWS_REGION || 'ap-northeast-1'
    })
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: 'image/jpeg',
      ACL: 'private', // プライベートアクセス
    })

    await s3Client.send(command)
    
    // S3のURLを返す
    const imageUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-northeast-1'}.amazonaws.com/${key}`
    console.log('S3アップロード成功:', imageUrl)
    
    return imageUrl
    
  } catch (error) {
    console.error('S3アップロードエラー:', error)
    
    // エラーの種類に応じてメッセージを変更
    if (error instanceof Error) {
      if (error.message.includes('AccessDenied')) {
        throw new Error('S3アクセス権限がありません')
      } else if (error.message.includes('NoSuchBucket')) {
        throw new Error('S3バケットが見つかりません')
      } else if (error.message.includes('NetworkError')) {
        throw new Error('ネットワーク接続エラーが発生しました')
      } else if (error.message.includes('AWS認証情報')) {
        throw new Error('AWS認証情報の設定に問題があります')
      }
    }
    
    throw new Error('画像のアップロードに失敗しました')
  }
}

/**
 * S3から画像を削除
 */
export async function deleteImageFromS3(imageUrl: string): Promise<void> {
  try {
    // URLからキーを抽出
    const urlParts = imageUrl.split('/')
    const key = urlParts.slice(3).join('/') // https://bucket.s3.region.amazonaws.com/key の key部分
    
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)
    console.log('S3から画像を削除しました:', key)
    
  } catch (error) {
    console.error('S3削除エラー:', error)
    // 削除エラーは警告として扱う（画像が存在しない場合など）
  }
}

/**
 * 署名付きURLを生成（一時的なアクセス用）
 */
export async function generatePresignedUrl(imageUrl: string, expiresIn: number = 3600): Promise<string> {
  try {
    const urlParts = imageUrl.split('/')
    const key = urlParts.slice(3).join('/')
    
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn })
    return presignedUrl
    
  } catch (error) {
    console.error('署名付きURL生成エラー:', error)
    throw new Error('画像アクセスURLの生成に失敗しました')
  }
}

/**
 * 開発環境用のローカル保存（フォールバック）
 */
export async function saveImageLocally(
  imageBuffer: Buffer,
  fileName: string,
  folder: string = 'verification'
): Promise<string> {
  try {
    const fs = require('fs')
    const path = require('path')
    
    const uploadDir = path.join(process.cwd(), 'uploads', folder)
    
    console.log('ローカル保存設定:', {
      uploadDir,
      fileName,
      folder,
      bufferSize: imageBuffer.length,
      cwd: process.cwd()
    })
    
    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(uploadDir)) {
      console.log('アップロードディレクトリを作成中:', uploadDir)
      try {
        fs.mkdirSync(uploadDir, { recursive: true })
        console.log('ディレクトリ作成成功')
      } catch (mkdirError) {
        console.error('ディレクトリ作成エラー:', mkdirError)
        throw new Error(`アップロードディレクトリの作成に失敗しました: ${uploadDir}`)
      }
    }
    
    const filePath = path.join(uploadDir, fileName)
    
    console.log('ローカル保存開始:', {
      uploadDir: uploadDir,
      fileName: fileName,
      filePath: filePath,
      size: imageBuffer.length
    })
    
    try {
      fs.writeFileSync(filePath, imageBuffer)
      console.log('ファイル書き込み成功')
    } catch (writeError) {
      console.error('ファイル書き込みエラー:', writeError)
      throw new Error(`ファイルの書き込みに失敗しました: ${filePath}`)
    }
    
    const imageUrl = `/uploads/${folder}/${fileName}`
    console.log('ローカル保存成功:', imageUrl)
    
    return imageUrl
    
  } catch (error) {
    console.error('ローカル保存エラー:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('ENOSPC')) {
        throw new Error('ディスク容量が不足しています')
      } else if (error.message.includes('EACCES')) {
        throw new Error('ファイル書き込み権限がありません')
      } else if (error.message.includes('ENOENT')) {
        throw new Error('アップロードディレクトリの作成に失敗しました')
      } else if (error.message.includes('EISDIR')) {
        throw new Error('指定されたパスがディレクトリです')
      } else if (error.message.includes('EROFS')) {
        throw new Error('読み取り専用ファイルシステムです')
      }
    }
    
    throw new Error('画像の保存に失敗しました')
  }
}

/**
 * 環境に応じた画像保存
 */
export async function saveImage(
  imageBuffer: Buffer,
  fileName: string,
  folder: string = 'verification'
): Promise<string> {
  try {
    // 開発環境ではローカル保存、本番環境ではS3
    if (process.env.NODE_ENV === 'production' && process.env.AWS_ACCESS_KEY_ID) {
      console.log('本番環境: S3にアップロード中...')
      return await uploadImageToS3(imageBuffer, fileName, folder)
    } else {
      console.log('開発環境: ローカルに保存中...')
      return await saveImageLocally(imageBuffer, fileName, folder)
    }
  } catch (error) {
    console.error('画像保存エラー:', error)
    
    // エラーの詳細情報をログに出力
    if (error instanceof Error) {
      console.error('エラー詳細:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    
    // フォールバック: ローカル保存を試行
    try {
      console.log('フォールバック: ローカル保存を試行中...')
      return await saveImageLocally(imageBuffer, fileName, folder)
    } catch (fallbackError) {
      console.error('フォールバック保存も失敗:', fallbackError)
      
      // フォールバックエラーの詳細情報も出力
      if (fallbackError instanceof Error) {
        console.error('フォールバックエラー詳細:', {
          name: fallbackError.name,
          message: fallbackError.message,
          stack: fallbackError.stack
        })
      }
      
      throw new Error('画像の保存に失敗しました。しばらく時間をおいて再度お試しください。')
    }
  }
}
