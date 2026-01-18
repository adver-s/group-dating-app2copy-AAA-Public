import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../utils/database';
import { getUserIdFromRequest } from '../../../../utils/api';

export async function GET(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    console.log('🔍 成立済み合コン一覧API開始');

    // ユーザーが参加している成立済み合コンを取得
    const confirmedMeetings = await executeQuery(`
      SELECT 
        ms.id,
        ms.matching_flow_id as match_id,
        ms.purpose,
        ms.datetime,
        ms.location,
        ms.link,
        ms.created_at as confirmed_at,
        t1.name as team1_name,
        t2.name as team2_name,
        t1.id as team1_id,
        t2.id as team2_id
      FROM meeting_schedules ms
      JOIN group_matching_flows gmf ON ms.matching_flow_id = gmf.matching_id
      JOIN teams t1 ON gmf.from_group_id = t1.id
      JOIN teams t2 ON gmf.to_group_id = t2.id
      JOIN team_members tm ON (tm.team_id = t1.id OR tm.team_id = t2.id)
      WHERE ms.status = 'confirmed'
      AND tm.user_id = ? AND tm.is_active = TRUE
      ORDER BY ms.datetime DESC
    `, [currentUserId]) as any[];

    console.log('✅ 成立済み合コン取得完了:', confirmedMeetings.length);

    // 各合コンの詳細情報を取得
    const meetingsWithDetails = await Promise.all(
      confirmedMeetings.map(async (meeting) => {
        // 参加者数を取得
        const team1Members = await executeQuery(`
          SELECT COUNT(*) as count
          FROM team_members
          WHERE team_id = ? AND is_active = TRUE
        `, [meeting.team1_id]) as any[];

        const team2Members = await executeQuery(`
          SELECT COUNT(*) as count
          FROM team_members
          WHERE team_id = ? AND is_active = TRUE
        `, [meeting.team2_id]) as any[];

        const participantCount = (team1Members[0]?.count || 0) + (team2Members[0]?.count || 0);

        // 相手チームの情報を取得（ユーザーが所属していない方）
        const userTeam = await executeQuery(`
          SELECT team_id
          FROM team_members
          WHERE user_id = ? AND team_id IN (?, ?) AND is_active = TRUE
        `, [currentUserId, meeting.team1_id, meeting.team2_id]) as any[];

        let otherTeamName = meeting.team2_name;
        let otherTeamId = meeting.team2_id;
        if (userTeam.length > 0 && userTeam[0].team_id === meeting.team2_id) {
          otherTeamName = meeting.team1_name;
          otherTeamId = meeting.team1_id;
        }

        // 相手チームの画像を取得
        const otherTeamPhotos = await executeQuery(`
          SELECT photo_url
          FROM team_photos
          WHERE team_id = ? AND status = 'active'
          ORDER BY display_order ASC, created_at ASC
          LIMIT 3
        `, [otherTeamId]) as any[];

        console.log('✅ 合コン詳細取得完了:', {
          id: meeting.id,
          otherTeamName,
          participantCount,
          photoCount: otherTeamPhotos.length
        });

        return {
          id: meeting.match_id,
          teamName: otherTeamName,
          purpose: meeting.purpose || '合コン',
          datetime: new Date(meeting.datetime),
          location: meeting.location || '未定',
          participantCount,
          status: 'confirmed' as const,
          teamPhotos: otherTeamPhotos.map(p => p.photo_url),
          confirmedAt: new Date(meeting.confirmed_at)
        };
      })
    );

    console.log('✅ 成立済み合コン一覧API完了:', meetingsWithDetails.length);
    return NextResponse.json({
      success: true,
      confirmedMeetings: meetingsWithDetails
    });

  } catch (error) {
    console.error('❌ 成立済み合コン取得エラー:', error);
    return NextResponse.json(
      { error: '成立済み合コンの取得に失敗しました' },
      { status: 500 }
    );
  }
}
