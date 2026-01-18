import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../utils/database';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 === 招待チーム取得API開始 ===');
    
    // Authorization headerからトークンを取得
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '認証トークンが必要です' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    console.log('🔍 Token length:', token.length);

    // JWTトークンをデコード
    let decoded;
    try {
      decoded = jwt.decode(token) as any;
      console.log('🔍 Decoded token: Success');
      console.log('🔍 Token payload:', decoded);
    } catch (error) {
      console.error('❌ Token decode error:', error);
      return NextResponse.json(
        { error: '無効なトークンです' },
        { status: 401 }
      );
    }

    if (!decoded || !decoded.sub) {
      return NextResponse.json(
        { error: 'ユーザーIDが見つかりません' },
        { status: 401 }
      );
    }

    const currentUserId = decoded.sub;
    console.log('✅ User ID extracted:', currentUserId);

    // 招待されたチームを取得（team_membersテーブルから）
    // created_atカラムが存在しない可能性があるため、CURRENT_TIMESTAMPを使用
    const invitedTeams = await executeQuery(`
      SELECT 
        t.id,
        t.name,
        t.description,
        t.created_at,
        t.updated_at,
        t.is_active,
        tm.is_active_team,
        CURRENT_TIMESTAMP as joined_at,
        u.username as inviter_username
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      JOIN users u ON t.created_by = u.id
      WHERE tm.user_id = ? AND tm.user_id != t.created_by
      ORDER BY t.created_at DESC
    `, [currentUserId]);

    console.log('🔍 招待されたチーム:', invitedTeams);

    return NextResponse.json({
      success: true,
      invitedTeams: invitedTeams
    });

  } catch (error) {
    console.error('❌ 招待チーム取得API エラー:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 === 招待コードでチーム参加API開始 ===');
    
    // Authorization headerからトークンを取得
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '認証トークンが必要です' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // JWTトークンをデコード
    let decoded;
    try {
      decoded = jwt.decode(token) as any;
    } catch (error) {
      console.error('Token decode error:', error);
      return NextResponse.json(
        { error: '無効なトークンです' },
        { status: 401 }
      );
    }

    if (!decoded || !decoded.sub) {
      return NextResponse.json(
        { error: 'ユーザーIDが見つかりません' },
        { status: 401 }
      );
    }

    const currentUserId = decoded.sub;
    const { inviteCode } = await req.json();
    
    console.log(`👥 User ${currentUserId} attempting to join team with invite code: ${inviteCode}`);

    if (!inviteCode) {
      return NextResponse.json(
        { error: '招待コードが必要です' },
        { status: 400 }
      );
    }

    // 招待コードからチームIDを取得
    const teamCheck = await executeQuery(`
      SELECT id, name FROM teams WHERE id = ?
    `, [inviteCode]) as any[];

    if (teamCheck.length === 0) {
      return NextResponse.json(
        { error: '無効な招待コードです' },
        { status: 404 }
      );
    }

    const teamId = inviteCode; // 招待コードはチームIDとして使用

    // 既にメンバーかチェック
    const existingMember = await executeQuery(`
      SELECT id FROM team_members 
      WHERE team_id = ? AND user_id = ?
    `, [teamId, currentUserId]) as any[];

    if (existingMember.length > 0) {
      return NextResponse.json(
        { error: '既にこのチームのメンバーです' },
        { status: 400 }
      );
    }

    // チームにメンバーとして追加（created_atカラムを削除）
    await executeQuery(`
      INSERT INTO team_members (team_id, user_id, is_active_team)
      VALUES (?, ?, FALSE)
    `, [teamId, currentUserId]);

    console.log(`✅ User ${currentUserId} successfully joined team ${teamId} with invite code`);

    return NextResponse.json({ 
      message: 'チームに参加しました',
      teamId,
      teamName: teamCheck[0].name
    });

  } catch (error) {
    console.error('Error joining team with invite code:', error);
    return NextResponse.json(
      { error: 'チームへの参加に失敗しました' },
      { status: 500 }
    );
  }
} 