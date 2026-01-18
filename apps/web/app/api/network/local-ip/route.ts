import { NextRequest, NextResponse } from 'next/server'
import { networkInterfaces } from 'os'

export async function GET(req: NextRequest) {
  try {
    const nets = networkInterfaces()
    let localIp = 'localhost'

    // 有効なネットワークインターフェースからIPアドレスを取得
    for (const name of Object.keys(nets)) {
      const interfaces = nets[name]
      if (interfaces) {
        for (const netInterface of interfaces) {
          // IPv4で、内部ループバックでないアドレスを探す
          if (netInterface.family === 'IPv4' && !netInterface.internal) {
            localIp = netInterface.address
            break
          }
        }
      }
      if (localIp !== 'localhost') break
    }

    return NextResponse.json({
      success: true,
      localIp: localIp,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('ローカルIPアドレス取得エラー:', error)
    
    return NextResponse.json({
      success: false,
      localIp: 'localhost',
      error: 'ローカルIPアドレスの取得に失敗しました',
      timestamp: new Date().toISOString()
    })
  }
}
