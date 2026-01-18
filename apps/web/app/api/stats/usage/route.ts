import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // モック統計データ
  const stats = {
    users: {
      total: 1250,
      active: {
        daily: 180,
        weekly: 450,
        monthly: 890
      }
    },
    matches: {
      total: 320,
      thisMonth: 45,
      successRate: 0.68
    },
    swipes: {
      total: 15420,
      today: 234,
      averagePerUser: 12.3
    },
    events: {
      total: 28,
      upcoming: 5,
      completed: 23
    },
    engagement: {
      averageSessionTime: 8.5, // minutes
      messagesPerMatch: 15.2,
      responseRate: 0.85
    }
  };

  return NextResponse.json(stats);
} 