import { NextRequest, NextResponse } from 'next/server';

// パフォーマンス監視データ
interface PerformanceData {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: Date;
}

const performanceData: PerformanceData[] = [];

// パフォーマンス監視ミドルウェア
export function withPerformanceMonitoring(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const startTime = Date.now();
    const url = req.url;
    const method = req.method;
    
    try {
      const response = await handler(req, ...args);
      const duration = Date.now() - startTime;
      
      // パフォーマンスデータを記録
      performanceData.push({
        endpoint: url,
        method,
        duration,
        status: response.status,
        timestamp: new Date()
      });
      
      // データが多すぎる場合は古いものを削除
      if (performanceData.length > 1000) {
        performanceData.splice(0, 100);
      }
      
      // 遅いリクエストをログ出力
      if (duration > 1000) {
        console.warn(`⚠️ Slow API call: ${method} ${url} took ${duration}ms`);
      }
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ API Error: ${method} ${url} failed after ${duration}ms:`, error);
      throw error;
    }
  };
}

// パフォーマンス統計を取得
export function getPerformanceStats() {
  if (performanceData.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      slowRequests: 0,
      errorRate: 0
    };
  }
  
  const totalRequests = performanceData.length;
  const averageResponseTime = performanceData.reduce((sum, data) => sum + data.duration, 0) / totalRequests;
  const slowRequests = performanceData.filter(data => data.duration > 1000).length;
  const errorRequests = performanceData.filter(data => data.status >= 400).length;
  const errorRate = (errorRequests / totalRequests) * 100;
  
  return {
    totalRequests,
    averageResponseTime: Math.round(averageResponseTime),
    slowRequests,
    errorRate: Math.round(errorRate * 100) / 100
  };
}

// 最近のリクエスト履歴を取得
export function getRecentRequests(limit: number = 10) {
  return performanceData
    .slice(-limit)
    .reverse()
    .map(data => ({
      ...data,
      timestamp: data.timestamp.toISOString()
    }));
} 