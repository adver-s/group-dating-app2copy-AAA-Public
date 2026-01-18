import { NextResponse } from 'next/server';
import { testConnection } from '@/utils/database';

export async function GET() {
  try {
    // データベース接続の確認
    const dbConnected = await testConnection();

    if (!dbConnected) {
      return NextResponse.json(
        { status: 'unhealthy', message: 'Database connection failed' },
        { status: 503 }
      );
    }

    // 基本的なアプリケーション情報
    const healthInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      uptime: process.uptime()
    };

    return NextResponse.json(healthInfo, { status: 200 });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        message: 'Application health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
} 