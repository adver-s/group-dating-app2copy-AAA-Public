import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../utils/database';
import { getUserIdFromRequest } from '../../../../utils/api';

export async function GET(req: NextRequest) {
  try {
    console.log('🔧 === 成立済み合コン一覧取得API開始 ===');
    
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      console.log('❌ 認証失敗: User ID not found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ 認証成功: User ID =', currentUserId);

    // ユーザーが所属するチームを取得
    const userTeams = await executeQuery(`
      SELECT team_id
      FROM team_members
      WHERE user_id = ?
    `, [currentUserId]) as any[];

    if (userTeams.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    const teamIds = userTeams.map(t => t.team_id);
    console.log('🔍 ユーザーのチーム:', teamIds);

    // ユーザーが関与する成立済み合コンを取得
    const confirmedMeetings = await executeQuery(`
      SELECT 
        ms.id,
        ms.matching_flow_id,
        ms.purpose,
        ms.datetime as scheduled_datetime,
        ms.location,
        ms.link as map_link,
        ms.status,
        ms.created_at,
        tmf.from_group_id as team1_id,
        tmf.to_group_id as team2_id,
        t1.name as team1_name,
        t2.name as team2_name
      FROM meeting_schedules ms
      JOIN team_matching_flows tmf ON ms.matching_flow_id = tmf.id
      JOIN teams t1 ON tmf.from_group_id = t1.id
      JOIN teams t2 ON tmf.to_group_id = t2.id
      WHERE ms.status = 'confirmed'
      AND (tmf.from_group_id IN (${teamIds.map(() => '?').join(',')}) 
         OR tmf.to_group_id IN (${teamIds.map(() => '?').join(',')}))
      ORDER BY ms.datetime DESC
      LIMIT 50
    `, [...teamIds, ...teamIds]) as any[];

    console.log('📋 取得した成立済み合コン数:', confirmedMeetings.length);

    // 各合コンの詳細情報を取得
    const meetingsWithDetails = await Promise.all(
      confirmedMeetings.map(async (meeting) => {
        // 参加人数を計算
        const team1Members = await executeQuery(`
          SELECT COUNT(*) as count
          FROM team_members
          WHERE team_id = ?
        `, [meeting.team1_id]) as any[];

        const team2Members = await executeQuery(`
          SELECT COUNT(*) as count
          FROM team_members
          WHERE team_id = ?
        `, [meeting.team2_id]) as any[];

        const participantCount = (team1Members[0]?.count || 0) + (team2Members[0]?.count || 0);

        // チーム画像を取得
        const team1Photos = await executeQuery(`
          SELECT photo_url
          FROM team_photos
          WHERE team_id = ? AND status = 'active'
          ORDER BY display_order ASC
          LIMIT 1
        `, [meeting.team1_id]) as any[];

        const team2Photos = await executeQuery(`
          SELECT photo_url
          FROM team_photos
          WHERE team_id = ? AND status = 'active'
          ORDER BY display_order ASC
          LIMIT 1
        `, [meeting.team2_id]) as any[];

        // ユーザーのチームを特定
        const isUserInTeam1 = teamIds.includes(meeting.team1_id);
        const userTeamName = isUserInTeam1 ? meeting.team1_name : meeting.team2_name;
        const otherTeamName = isUserInTeam1 ? meeting.team2_name : meeting.team1_name;

        return {
          id: meeting.id,
          matchingFlowId: meeting.matching_flow_id,
          teamName: `${meeting.team1_name} × ${meeting.team2_name}`,
          userTeamName,
          otherTeamName,
          purpose: meeting.purpose || '合コン',
          datetime: meeting.scheduled_datetime,
          location: meeting.location,
          mapLink: meeting.map_link,
          status: meeting.status,
          participantCount,
          teamPhotos: [
            ...(team1Photos.length > 0 ? [team1Photos[0].photo_url] : []),
            ...(team2Photos.length > 0 ? [team2Photos[0].photo_url] : [])
          ],
          createdAt: meeting.created_at
        };
      })
    );

    console.log('✅ 成立済み合コン一覧取得完了');

    return NextResponse.json({
      success: true,
      data: meetingsWithDetails
    });

  } catch (error) {
    console.error('❌ 成立済み合コン一覧取得API エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 