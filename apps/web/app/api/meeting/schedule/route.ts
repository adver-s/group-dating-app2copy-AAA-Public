import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../utils/database';
import { getUserIdFromRequest } from '../../../../utils/api';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    console.log('🔧 === 予定調整確定API開始 ===');
    
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      console.log('❌ 認証失敗: User ID not found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ 認証成功: User ID =', currentUserId);

    const { matchingFlowId, scheduleData } = await req.json();

    if (!matchingFlowId || !scheduleData) {
      return NextResponse.json(
        { error: 'マッチングフローIDと予定データが必要です' },
        { status: 400 }
      );
    }

    console.log('🔍 受信データ:', { matchingFlowId, scheduleData });
    
    // データベース接続テスト
    try {
      const testQuery = await executeQuery('SELECT 1 as test') as any[];
      console.log('✅ データベース接続テスト成功:', testQuery);
    } catch (dbError) {
      console.error('❌ データベース接続テスト失敗:', dbError);
      return NextResponse.json(
        { error: 'データベース接続エラー' },
        { status: 500 }
      );
    }

    // マッチングフローが存在し、正式マッチング（status = 3）かチェック
    console.log('🔍 マッチングフロー取得開始:', matchingFlowId);
    let matchingFlow;
    try {
      // まず、マッチングフロー自体を取得
      const flowQuery = await executeQuery(`
        SELECT 
          id as matching_id,
          status,
          from_group_id as team1_id,
          to_group_id as team2_id
        FROM team_matching_flows
        WHERE id = ? AND status = 3
      `, [matchingFlowId]) as any[];
      
      if (flowQuery.length === 0) {
        console.log('❌ 成立したマッチングが見つかりません:', matchingFlowId);
        return NextResponse.json(
          { error: '成立したマッチングが見つかりません' },
          { status: 404 }
        );
      }

      const flow = flowQuery[0];
      console.log('✅ マッチングフロー取得成功:', flow);

      // チーム名を個別に取得（存在しない場合はデフォルト名を使用）
      let team1Name = 'チーム1';
      let team2Name = 'チーム2';

      try {
        const team1Query = await executeQuery(`
          SELECT name FROM teams WHERE id = ?
        `, [flow.team1_id]) as any[];
        
        if (team1Query.length > 0) {
          team1Name = team1Query[0].name;
        }
      } catch (error) {
        console.log('⚠️ チーム1名取得エラー、デフォルト名を使用:', flow.team1_id);
      }

      try {
        const team2Query = await executeQuery(`
          SELECT name FROM teams WHERE id = ?
        `, [flow.team2_id]) as any[];
        
        if (team2Query.length > 0) {
          team2Name = team2Query[0].name;
        }
      } catch (error) {
        console.log('⚠️ チーム2名取得エラー、デフォルト名を使用:', flow.team2_id);
      }

      matchingFlow = [{
        ...flow,
        team1_name: team1Name,
        team2_name: team2Name
      }];

      console.log('✅ マッチングフロー情報完成:', matchingFlow);
    } catch (flowError) {
      console.error('❌ マッチングフロー取得エラー:', flowError);
      return NextResponse.json(
        { error: 'マッチングフロー取得エラー' },
        { status: 500 }
      );
    }

    if (matchingFlow.length === 0) {
      console.log('❌ 成立したマッチングが見つかりません:', matchingFlowId);
      return NextResponse.json(
        { error: '成立したマッチングが見つかりません' },
        { status: 404 }
      );
    }

    const flow = matchingFlow[0];
    console.log('✅ マッチングフロー確認:', flow);

    // ユーザーがこのマッチングに関連するチームのメンバーかチェック
    const userTeam = await executeQuery(`
      SELECT team_id
      FROM team_members
      WHERE user_id = ? AND team_id IN (?, ?) AND is_active = TRUE
    `, [currentUserId, flow.team1_id, flow.team2_id]) as any[];

    if (userTeam.length === 0) {
      return NextResponse.json(
        { error: 'このマッチングに関連するチームのメンバーではありません' },
        { status: 403 }
      );
    }

    // 既に予定が確定されているかチェック
    const existingSchedule = await executeQuery(`
      SELECT id FROM meeting_schedules 
      WHERE matching_flow_id = ? AND status = 'confirmed'
    `, [matchingFlowId]) as any[];

    if (existingSchedule.length > 0) {
      return NextResponse.json(
        { error: '既に予定が確定されています' },
        { status: 409 }
      );
    }

    // 予定データをバリデーション
    const { purpose, datetime, location, link } = scheduleData;
    
    if (!purpose || !datetime || !location) {
      return NextResponse.json(
        { error: '目的、日時、場所は必須です' },
        { status: 400 }
      );
    }

    // 日時を適切な形式に変換
    const scheduledDateTime = new Date(datetime);
    if (isNaN(scheduledDateTime.getTime())) {
      return NextResponse.json(
        { error: '無効な日時形式です' },
        { status: 400 }
      );
    }

    // meeting_schedulesテーブルに挿入
    const scheduleId = uuidv4();
    await executeQuery(`
      INSERT INTO meeting_schedules (
        id, matching_flow_id, purpose, datetime, location, link, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'confirmed', CURRENT_TIMESTAMP)
    `, [
      scheduleId,
      matchingFlowId,
      purpose,
      scheduledDateTime,
      location,
      link || null
    ]);

    console.log('✅ 予定確定完了:', scheduleId);

    // 両チームのメンバー全員を取得
    const allMembers = await executeQuery(`
      SELECT DISTINCT tm.user_id, u.username
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id IN (?, ?) AND tm.is_active = TRUE
    `, [flow.team1_id, flow.team2_id]) as any[];

    console.log('✅ 両チームメンバー取得完了:', allMembers.length);

    // チャットルームにシステムメッセージを送信（両チーム全員に通知）
    const chatRoomId = `chat_${matchingFlowId}`;
    const systemMessageId = `system_${Date.now()}_${uuidv4()}`;
    
    try {
      await executeQuery(`
        INSERT INTO chat_messages (
          id, chat_room_id, sender_id, message, message_type, created_at
        ) VALUES (?, ?, 'system', ?, 'system', CURRENT_TIMESTAMP)
      `, [
        systemMessageId,
        chatRoomId,
        `🎉 合コンが成立しました！\n📅 ${purpose}\n🕐 ${scheduledDateTime.toLocaleString('ja-JP')}\n📍 ${location}`
      ]);
      
      console.log('✅ システムメッセージ送信完了');
    } catch (error) {
      console.log('⚠️ システムメッセージ送信スキップ:', error);
    }

    // 両チームのメンバー全員の情報を取得
    const team1Members = await executeQuery(`
      SELECT tm.user_id, u.username
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ? AND tm.is_active = TRUE
    `, [flow.team1_id]) as any[];

    const team2Members = await executeQuery(`
      SELECT tm.user_id, u.username
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ? AND tm.is_active = TRUE
    `, [flow.team2_id]) as any[];

    return NextResponse.json({
      success: true,
      message: '予定を確定しました！両チーム全員に通知されました。',
      data: {
        scheduleId,
        matchingFlowId,
        purpose,
        scheduledDateTime,
        location,
        link,
        team1Name: flow.team1_name,
        team2Name: flow.team2_name,
        team1Members: team1Members.map(m => ({ id: m.user_id, username: m.username })),
        team2Members: team2Members.map(m => ({ id: m.user_id, username: m.username })),
        totalMembers: allMembers.length,
        chatRoomId
      }
    });

  } catch (error) {
    console.error('❌ 予定調整確定API エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 