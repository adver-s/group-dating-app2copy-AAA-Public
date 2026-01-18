import { NextRequest, NextResponse } from 'next/server';
import { getPerformanceStats, getRecentRequests } from '../../../../utils/monitoring';

export async function GET(req: NextRequest) {
  try {
    const stats = getPerformanceStats();
    const recentRequests = getRecentRequests(20);
    
    return NextResponse.json({
      success: true,
      stats,
      recentRequests,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Monitoring stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get monitoring stats' },
      { status: 500 }
    );
  }
} 