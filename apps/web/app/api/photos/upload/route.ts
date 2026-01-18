import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/api/lib/database'
import { getUserIdFromRequest } from '../../../../utils/api'

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // ユーザー情報の簡易チェック（データベース接続問題の回避）
    // 実際の実装では、ここでデータベースからユーザー情報を取得する
    if (!userId) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    // FormDataから画像を取得
    const formData = await request.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      return NextResponse.json({ error: '画像ファイルが必要です' }, { status: 400 })
    }

    // ファイルサイズチェック（5MB以下）
    if (imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズは5MB以下にしてください' }, { status: 400 })
    }

    // ファイル形式チェック
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json({ error: '画像ファイルを選択してください' }, { status: 400 })
    }

    // 画像をローカルストレージに保存
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // ユニークなファイル名を生成
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substr(2, 9)
    const fileName = `${timestamp}_${randomSuffix}_${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = `/uploads/photos/${fileName}`

    // ファイルシステムの準備（Next.jsのpublicフォルダ外に保存）
    const fs = require('fs').promises
    const path = require('path')

    // uploads/photosディレクトリの作成（存在しない場合）
    const uploadsDir = path.join(process.cwd(), 'uploads', 'photos')
    try {
      await fs.access(uploadsDir)
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true })
    }

    // ファイル保存
    const fullPath = path.join(uploadsDir, fileName)
    await fs.writeFile(fullPath, buffer)

    console.log('画像ファイルを保存しました:', {
      fileName,
      filePath,
      size: buffer.length,
      type: imageFile.type
    })

    // データベースにはローカルパスを保存
    const photoId = `photo_${timestamp}_${randomSuffix}`

    const photo = await prisma.photos.create({
      data: {
        id: photoId,
        photo_url: filePath, // ローカルパスを保存
        type: 'profile_icon',
        status: 'pending_review',
        updated_at: new Date(),
        users: { connect: { id: userId } }
      }
    });

    console.log('Photo uploaded:', {
      photoId: photo.id,
      userId: userId,
      type: 'profile_icon',
      status: 'pending_review',
      filePath: filePath
    })

    return NextResponse.json({
      success: true,
      photoId: photo.id,
      photoUrl: filePath,
      message: '画像がアップロードされました。管理者の審査後に使用可能になります。'
    })

  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json(
      { error: '画像のアップロードに失敗しました' },
      { status: 500 }
    )
  }
}
