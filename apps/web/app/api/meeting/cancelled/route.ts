import { NextRequest, NextResponse } from 'next/server';

const meetings = [
  { id: '2', teams: ['2', '3'], date: '2024-06-12T20:00:00Z', status: 'cancelled' },
];

export async function GET(req: NextRequest) {
  return NextResponse.json(meetings);
} 