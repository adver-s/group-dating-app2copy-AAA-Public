import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // 複数の外部サービスからパブリックIPアドレスを取得（フォールバック用）
    let publicIp = null
    let localIp = null

    // リクエストヘッダーからローカルIPを取得
    localIp = req.headers.get('x-forwarded-for') || 
              req.headers.get('x-real-ip') || 
              req.headers.get('x-client-ip') ||
              'unknown'

    // 複数の外部サービスを試す
    const ipServices = [
      'https://api.ipify.org?format=json',
      'https://api.myip.com',
      'https://ipapi.co/json/',
      'https://httpbin.org/ip'
    ]

    for (const service of ipServices) {
      try {
        const response = await fetch(service, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; GroupDatingApp/1.0)'
          },
          signal: AbortSignal.timeout(5000) // 5秒タイムアウト
        })

        if (response.ok) {
          const data = await response.json()
          
          // サービスによってレスポンス形式が異なるため、複数のフィールドをチェック
          publicIp = data.ip || data.query || data.origin || data.ipAddress
          
          if (publicIp && publicIp !== 'unknown') {
            break
          }
        }
      } catch (error) {
        console.log(`IP取得サービス ${service} でエラー:`, error)
        continue
      }
    }

    // パブリックIPが取得できない場合は、環境変数から取得
    if (!publicIp || publicIp === 'unknown') {
      publicIp = process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, '').replace(/:\d+$/, '') ||
                 process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '').replace(/:\d+$/, '') ||
                 'localhost'
    }

    return NextResponse.json({
      success: true,
      publicIp: publicIp,
      localIp: localIp,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL
    })
  } catch (error) {
    console.error('IPアドレス取得エラー:', error)
    
    // フォールバック: 環境変数から取得
    const fallbackIp = process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, '').replace(/:\d+$/, '') ||
                       process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '').replace(/:\d+$/, '') ||
                       'localhost'
    
    return NextResponse.json({
      success: false,
      publicIp: fallbackIp,
      localIp: fallbackIp,
      error: 'IPアドレスの取得に失敗しました',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL
    })
  }
} 