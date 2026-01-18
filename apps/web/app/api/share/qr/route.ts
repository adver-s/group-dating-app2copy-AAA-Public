import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const url = searchParams.get('url') || req.headers.get('origin') || 'http://localhost:3000'
    
    // 簡易的なQRコードデータを生成（実際のQRコードライブラリを使用することを推奨）
    const qrData = {
      url: url,
      timestamp: new Date().toISOString(),
      message: 'グループ合コンアプリに参加しましょう！'
    }

    return NextResponse.json({
      success: true,
      data: qrData,
      qrCode: `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                    📱 グループ合コンアプリ                    ║
║                                                              ║
║  URL: ${url.padEnd(50)} ║
║                                                              ║
║  このURLをブラウザで開くか、QRコードスキャナーで読み取ってください  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
      `.trim()
    })
  } catch (error) {
    console.error('QRコード生成エラー:', error)
    return NextResponse.json(
      { error: 'QRコードの生成に失敗しました' },
      { status: 500 }
    )
  }
} 