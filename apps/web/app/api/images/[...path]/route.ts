import { promises as fs } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const imagePath = pathSegments.join('/');

    // セキュリティチェック：パストラバーサル攻撃を防ぐ
    if (imagePath.includes('..') || imagePath.includes('//')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // uploadsフォルダからの相対パス（photosサブディレクトリも対応）
    const fullPath = path.join(process.cwd(), imagePath);

    // ファイルの存在確認
    try {
      await fs.access(fullPath);
    } catch {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // ファイルを読み込み
    const imageBuffer = await fs.readFile(fullPath);

    // ファイル拡張子からContent-Typeを決定
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = 'application/octet-stream';

    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
    }

    // 画像を返す
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // 1年間キャッシュ
      },
    });

  } catch (error) {
    console.error('Image serving error:', error);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
}
