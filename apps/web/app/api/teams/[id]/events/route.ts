import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/utils/database';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const events = await executeQuery(`
      SELECT 
        e.id,
        e.title,
        e.description,
        e.date,
        e.location,
        e.status,
        e.created_at
      FROM events e
      JOIN team_events te ON e.id = te.event_id
      WHERE te.team_id = ?
      ORDER BY e.date DESC
    `, [id]);

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching team events:', error);
    return NextResponse.json(
      { error: 'チームイベントの取得に失敗しました' },
      { status: 500 }
    );
  }
} 