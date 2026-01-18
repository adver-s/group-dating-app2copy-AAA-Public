import { withErrorHandler } from '@/middleware/errorHandler';
import { getUserIdFromRequest } from '@/utils/api';
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../../utils/database';

export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id: teamId } = await params;
  const currentUserId = getUserIdFromRequest(req);

  console.log('🔍 === チームメンバー取得API開始 ===');
  console.log('🔍 Team ID:', teamId);
  console.log('🔍 Current User ID:', currentUserId);

  if (!currentUserId) {
    console.log('❌ 認証エラー: currentUserId が null');
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    // チームの存在確認
    console.log('🔍 チーム存在確認中...');
    const teamRows = await executeQuery(`
      SELECT id, name, description, gender, created_at, updated_at, is_active
      FROM teams 
      WHERE id = ?
    `, [teamId]);

    if (!teamRows || teamRows.length === 0) {
      console.log('❌ チームが見つかりません:', teamId);
      return NextResponse.json({ error: 'チームが見つかりません' }, { status: 404 });
    }

    const team = teamRows[0];
    console.log('✅ チーム確認完了:', team.name);

    // チームメンバーとその最新情報を取得
    console.log('🔍 チームメンバー取得中...');

    // 基本的なメンバー情報を取得
    const members = await executeQuery(`
      SELECT 
        tm.id as member_id,
        tm.team_id,
        tm.user_id,
        tm.joined_at,
        tm.is_active as member_is_active,
        u.id as user_id,
        u.username,
        u.gender,
        u.bio,
        u.age,
        u.avatar_url,
        u.created_at as user_created_at,
        u.updated_at as user_updated_at
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
      ORDER BY tm.joined_at ASC
    `, [teamId]);

    console.log('✅ 基本メンバー情報取得完了:', members.length, '人');

    // 各ユーザーの写真情報を個別に取得
    const membersWithPhotos = await Promise.all(
      members.map(async (member) => {
        try {
          const photos = await executeQuery(`
            SELECT photo_url, status
            // photosテーブルは削除されました
            WHERE user_id = ? AND status = 'active'
            ORDER BY created_at DESC
            LIMIT 1
          `, [member.user_id]);

          console.log(`🔍 ユーザー ${member.user_id} の写真:`, photos.length, '枚');

          return {
            ...member,
            user_photos: photos
          };
        } catch (photoError) {
          console.error('❌ 写真取得エラー (user_id:', member.user_id, '):', photoError);
          return {
            ...member,
            user_photos: []
          };
        }
      })
    );

    console.log('✅ メンバー取得完了:', membersWithPhotos.length, '人');

    // メンバー情報を整形（最新のプロフィール情報を含む）
    const formattedMembers = membersWithPhotos.map(member => {
      const latestPhoto = member.user_photos.length > 0 ? member.user_photos[0] : null;

      return {
        id: member.member_id,
        team_id: member.team_id,
        user_id: member.user_id,
        joined_at: member.joined_at,
        is_active: member.member_is_active,
        users: {
          id: member.user_id,
          username: member.username,
          gender: member.gender,
          bio: member.bio,
          age: member.age,
          avatar_url: member.avatar_url,
          created_at: member.user_created_at,
          updated_at: member.user_updated_at,
          user_photos: member.user_photos
        },
        latest_photo: latestPhoto ? latestPhoto.photo_url : null
      };
    });

    console.log('✅ メンバー情報整形完了');

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        gender: team.gender,
        created_at: team.created_at,
        updated_at: team.updated_at,
        is_active: team.is_active
      },
      members: formattedMembers,
      member_count: formattedMembers.length
    });

  } catch (error) {
    console.error('❌ チームメンバー取得エラー:', error);
    throw error;
  }
});

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id: teamId } = await params;
  const currentUserId = getUserIdFromRequest(req);

  if (!currentUserId) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { userId, inviteCode, email } = body;

    // チームの存在確認
    const team = await executeQuery(`
      SELECT id, name, description, gender, created_at, updated_at, is_active
      FROM teams 
      WHERE id = ?
    `, [teamId]);

    if (!team || team.length === 0) {
      return NextResponse.json({ error: 'チームが見つかりません' }, { status: 404 });
    }

    let targetUserId = userId;

    // 招待コードが提供された場合
    if (inviteCode && !userId) {
      // 招待コードからユーザーIDを取得（招待コードがユーザーIDとして使用される場合）
      const user = await executeQuery(`
        SELECT id
        FROM users
        WHERE id = ?
      `, [inviteCode]);

      if (!user || user.length === 0) {
        return NextResponse.json({ error: '無効な招待コードです' }, { status: 404 });
      }

      targetUserId = inviteCode;
    }

    // メールアドレスが提供された場合（emailフィールドが存在しないため、この機能は無効化）
    if (email && !userId && !inviteCode) {
      return NextResponse.json({ error: 'メールアドレスによる検索は現在サポートされていません' }, { status: 400 });
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'ユーザーIDまたは招待コードが必要です' }, { status: 400 });
    }

    // 既にメンバーかチェック
    const existingMember = await executeQuery(`
      SELECT id
      FROM team_members
      WHERE team_id = ? AND user_id = ?
    `, [teamId, targetUserId]);

    if (existingMember && existingMember.length > 0) {
      return NextResponse.json({ error: '既にこのチームのメンバーです' }, { status: 400 });
    }

    // ユーザーの存在確認
    const user = await executeQuery(`
      SELECT id, username
      FROM users
      WHERE id = ?
    `, [targetUserId]);

    if (!user || user.length === 0) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // メンバーとして追加
    const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await executeQuery(`
      INSERT INTO team_members (id, team_id, user_id, joined_at, is_active)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, false)
    `, [memberId, teamId, targetUserId]);

    return NextResponse.json({
      success: true,
      message: 'メンバーを追加しました',
      userId: targetUserId,
      username: user[0].username
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding member to team:', error);
    return NextResponse.json({ error: 'メンバーの追加に失敗しました' }, { status: 500 });
  }
}); 