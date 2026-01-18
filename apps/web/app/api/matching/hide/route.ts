import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../utils/database';

// Hide登録
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, hiddenGroupId, hiddenUntil } = body;

    if (!userId || !hiddenGroupId) {
      return NextResponse.json(
        { success: false, error: 'userId and hiddenGroupId are required' },
        { status: 400 }
      );
    }

    // Hideをデータベースに保存
    const hideId = `hide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await executeQuery(`
      INSERT INTO userHiddenGroup (id, user_id, hidden_group_id, hidden_until, status, hidden_from)
      VALUES (?, ?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP)
    `, [hideId, userId, hiddenGroupId, hiddenUntil || null]);

    return NextResponse.json({
      success: true,
      data: {
        id: hideId,
        userId,
        hiddenGroupId,
        status: 'ACTIVE',
        hiddenFrom: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating hide:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Hide解除
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const hiddenGroupId = searchParams.get('hiddenGroupId');

    if (!userId || !hiddenGroupId) {
      return NextResponse.json(
        { success: false, error: 'userId and hiddenGroupId are required' },
        { status: 400 }
      );
    }

    // Hideを削除
    await executeQuery(`
      DELETE FROM userHiddenGroup 
      WHERE user_id = ? AND hidden_group_id = ?
    `, [userId, hiddenGroupId]);

    return NextResponse.json({
      success: true,
      message: 'Hide removed successfully'
    });

  } catch (error) {
    console.error('Error deleting hide:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Hide一覧取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Hide一覧を取得
    const hides = await executeQuery(`
      SELECT 
        id,
        user_id,
        hidden_group_id,
        hidden_until,
        status,
        hidden_from
      FROM userHiddenGroup
      WHERE user_id = ? AND status = 'ACTIVE'
      ORDER BY hidden_from DESC
    `, [userId]) as any[];

    return NextResponse.json({
      success: true,
      data: hides
    });

  } catch (error) {
    console.error('Error fetching hides:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
