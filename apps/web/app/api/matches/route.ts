import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/utils/api';
import { executeQuery } from '@/utils/database';

export async function GET(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    console.log('🔍 マッチ一覧API開始 - ユーザーID:', currentUserId);

    // ユーザーが参加している正式マッチング（status = 3）の情報を取得
    const matches = await executeQuery(`
      SELECT DISTINCT
        tmf.id as id,
        tmf.status,
        tmf.created_at,
        tmf.updated_at as updated_at,
        tmf.updated_at as match_confirmed_at,
        t1.name as team1_name,
        t2.name as team2_name,
        t1.id as team1_id,
        t2.id as team2_id
      FROM team_matching_flows tmf
      JOIN teams t1 ON tmf.from_group_id = t1.id
      JOIN teams t2 ON tmf.to_group_id = t2.id
      JOIN team_members tm ON (tm.team_id = t1.id OR tm.team_id = t2.id)
      WHERE tmf.status = 3
      AND tm.user_id = ? AND tm.is_active = TRUE
      ORDER BY tmf.updated_at DESC
      LIMIT 20
    `, [currentUserId]);

    console.log('✅ マッチデータ取得完了:', matches.length);

    // 各マッチの詳細情報を取得
    const matchesWithDetails = await Promise.all(
      (matches as any[]).map(async (match) => {
        console.log('🔍 マッチ詳細取得中:', match.id);

        // ユーザーが所属するチームを特定
        const userTeam = await executeQuery(`
          SELECT team_id
          FROM team_members
          WHERE user_id = ? AND team_id IN (?, ?) AND is_active = TRUE
        `, [currentUserId, match.team1_id, match.team2_id]) as any[];

        const userTeamId = userTeam[0]?.team_id;
        const otherTeamId = userTeamId === match.team1_id ? match.team2_id : match.team1_id;
        const otherTeamName = userTeamId === match.team1_id ? match.team2_name : match.team1_name;

        // チャットメッセージの最新情報を取得
        let lastMessage = 'まだメッセージがありません';
        let lastMessageTime = match.match_confirmed_at;

        try {
          const chatRoomId = `chat_${match.id}`;
          const chatMessages = await executeQuery(`
            SELECT message as content, created_at
            FROM chat_messages
            WHERE chat_room_id = ?
            ORDER BY created_at DESC
            LIMIT 1
          `, [chatRoomId]) as any[];

          if (chatMessages.length > 0) {
            lastMessage = chatMessages[0].content || '新しいメッセージがあります';
            lastMessageTime = chatMessages[0].created_at;
          }
        } catch (error) {
          console.log('⚠️ チャットメッセージ取得スキップ:', error);
        }

        // 各チームのメンバー数を取得
        const team1Members = await executeQuery(`
          SELECT COUNT(DISTINCT user_id) as count
          FROM team_members
          WHERE team_id = ? AND is_active = TRUE
        `, [match.team1_id]) as any[];

        const team2Members = await executeQuery(`
          SELECT COUNT(DISTINCT user_id) as count
          FROM team_members
          WHERE team_id = ? AND is_active = TRUE
        `, [match.team2_id]) as any[];

        const team1CountRaw = team1Members[0]?.count || 0;
        const team2CountRaw = team2Members[0]?.count || 0;
        const team1Count = typeof team1CountRaw === 'bigint' ? Number(team1CountRaw) : team1CountRaw;
        const team2Count = typeof team2CountRaw === 'bigint' ? Number(team2CountRaw) : team2CountRaw;
        const totalMembers = Number(team1Count) + Number(team2Count);

        // 会いたい意思表示の状況を取得
        let meetIntents = {};
        let intentMembers = 0;
        let totalIntentMembers = 0;

        try {
          const judgements = await executeQuery(`
            SELECT DISTINCT userId, groupId
            FROM group_member_judgements
            WHERE matchingId = ? AND judgement = 'LIKE'
          `, [match.id]) as any[];

          intentMembers = judgements.length;
          totalIntentMembers = Number(totalMembers);

          // チーム別の意思表示を整理
          const team1Intents = judgements.filter(j => j.groupId === match.team1_id).map(j => j.userId);
          const team2Intents = judgements.filter(j => j.groupId === match.team2_id).map(j => j.userId);

          meetIntents = {
            [match.team1_id]: team1Intents,
            [match.team2_id]: team2Intents
          };
        } catch (error) {
          console.log('⚠️ 意思表示データ取得スキップ:', error);
        }

        // 予定調整の状況を確認
        let schedule = null;
        let status = 'chatting';

        try {
          const meetingSchedule = await executeQuery(`
            SELECT 
              purpose,
              datetime,
              location,
              link
            FROM meeting_schedules
            WHERE matching_flow_id = ? AND status = 'confirmed'
            ORDER BY created_at DESC
            LIMIT 1
          `, [match.id]) as any[];

          if (meetingSchedule.length > 0) {
            schedule = {
              purpose: meetingSchedule[0].purpose || '合コン',
              datetime: new Date(meetingSchedule[0].datetime),
              location: meetingSchedule[0].location || '未定',
              link: meetingSchedule[0].link
            };
            status = 'confirmed';
          } else if (intentMembers === totalMembers && totalMembers > 0) {
            status = 'scheduling';
          }
        } catch (error) {
          console.log('⚠️ 予定調整データ取得スキップ:', error);
        }

        // 相手チームの審査済み画像を取得
        const otherTeamPhotos = await executeQuery(`
          SELECT photo_url
          FROM team_photos
          WHERE team_id = ? AND status = 'active'
          ORDER BY display_order ASC, created_at ASC
          LIMIT 3
        `, [otherTeamId]) as any[];

        console.log('✅ マッチ詳細取得完了:', {
          id: match.id,
          status,
          intentMembers,
          totalIntentMembers,
          hasSchedule: !!schedule,
          userTeamId,
          otherTeamId,
          otherTeamName
        });

        // BigIntを含まないように正規化
        const normalize = (obj: any) => {
          const out: any = {}
          for (const k of Object.keys(obj)) {
            const v = obj[k]
            out[k] = typeof v === 'bigint' ? Number(v) : v
          }
          return out
        }

        return normalize({
          id: match.id,
          teamName: otherTeamName, // 相手チーム名を表示
          lastMessage,
          timestamp: new Date(lastMessageTime),
          status: status as 'chatting' | 'scheduling' | 'confirmed',
          meetIntents,
          totalMembers: totalIntentMembers,
          intentMembers,
          schedule,
          teamPhotos: otherTeamPhotos.map(p => p.photo_url), // 相手チームの写真
          otherTeamName: otherTeamName, // 相手チーム名
          otherTeamId: otherTeamId, // 相手チームID
          userTeamId: userTeamId // ユーザーのチームID
        });
      })
    );
    
    console.log('✅ マッチ一覧API完了:', matchesWithDetails.length);
    return NextResponse.json(matchesWithDetails);
  } catch (error) {
    console.error('❌ DB接続エラー:', error);
    return NextResponse.json(
      { error: 'データベース接続エラー' },
      { status: 500 }
    );
  }
} 