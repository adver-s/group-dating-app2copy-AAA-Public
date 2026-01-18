import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/utils/database';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { userId } = body;

    // 通知を既読にする
    await executeQuery(`
      UPDATE notifications 
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `, [id, userId]);

    return NextResponse.json({ message: '通知を既読にしました' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: '通知の既読化に失敗しました' },
      { status: 500 }
    );
  }
} 