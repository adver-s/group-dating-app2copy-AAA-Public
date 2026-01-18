import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../utils/database';
import { getUserIdFromRequest } from '../../../../utils/api';
import { chatMessageService, chatReadStatusService, generateTimestampId } from '../../../../utils/dynamodb';

// チャットルーム一覧を取得
export async function GET(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // ユーザーが参加しているマッチを取得
    const userMatches = await executeQuery(`
      SELECT 
        m.id as match_id,
        m.team1_id,
        m.team2_id,
        m.status,
        m.created_at,
        t1.name as team1_name,
        t2.name as team2_name
      FROM matches m
      JOIN teams t1 ON m.team1_id = t1.id
      JOIN teams t2 ON m.team2_id = t2.id
      JOIN team_members tm1 ON m.team1_id = tm1.team_id
      JOIN team_members tm2 ON m.team2_id = tm2.team_id
      WHERE (tm1.user_id = ? OR tm2.user_id = ?)
      AND m.status = 'confirmed'
      ORDER BY m.created_at DESC
    `, [currentUserId, currentUserId]) as any[];

    // 各マッチのチャット情報を取得
    const chatRooms = await Promise.all(
      userMatches.map(async (match) => {
        const chatRoomId = `chat_${match.match_id}`;
        
        // 最新メッセージを取得
        const messages = await chatMessageService.getMessages(chatRoomId, 1);
        const lastMessage = messages.length > 0 ? messages[0] : null;
        
        // 既読状態を取得
        const readStatus = await chatReadStatusService.getReadStatus(chatRoomId, currentUserId);
        
        // 未読数を計算
        let unreadCount = 0;
        if (readStatus && lastMessage) {
          const lastReadTime = new Date(readStatus.lastReadAt);
          const lastMessageTime = new Date(lastMessage.createdAt);
          if (lastMessageTime > lastReadTime && lastMessage.senderId !== currentUserId) {
            unreadCount = 1; // 簡易的な未読数計算
          }
        }

        return {
          id: chatRoomId,
          matchId: match.match_id,
          name: `${match.team1_name} × ${match.team2_name}`,
          lastMessage: lastMessage ? {
            text: lastMessage.message,
            senderId: lastMessage.senderId,
            timestamp: lastMessage.createdAt
          } : null,
          unreadCount,
          createdAt: match.created_at
        };
      })
    );

    return NextResponse.json({
      success: true,
      chatRooms
    });

  } catch (error) {
    console.error('チャットルーム取得エラー:', error);
    return NextResponse.json(
      { error: 'チャットルーム取得エラー' },
      { status: 500 }
    );
  }
}

// 新しいチャットルームを作成（マッチ成立時に自動的に呼ばれる）
export async function POST(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { matchId } = await req.json();

    if (!matchId) {
      return NextResponse.json(
        { error: 'マッチIDが必要です' },
        { status: 400 }
      );
    }

    // マッチが存在し、ユーザーが参加しているかチェック
    const match = await executeQuery(`
      SELECT 
        m.id,
        m.team1_id,
        m.team2_id,
        m.status,
        t1.name as team1_name,
        t2.name as team2_name
      FROM matches m
      JOIN teams t1 ON m.team1_id = t1.id
      JOIN teams t2 ON m.team2_id = t2.id
      JOIN team_members tm1 ON m.team1_id = tm1.team_id
      JOIN team_members tm2 ON m.team2_id = tm2.team_id
      WHERE m.id = ? AND (tm1.user_id = ? OR tm2.user_id = ?)
      AND m.status = 'confirmed'
    `, [matchId, currentUserId, currentUserId]) as any[];

    if (match.length === 0) {
      return NextResponse.json(
        { error: 'マッチが見つからないか、アクセス権限がありません' },
        { status: 404 }
      );
    }

    const matchData = match[0];
    const chatRoomId = `chat_${matchId}`;

    // システムメッセージを送信
    const systemMessage = {
      chatRoomId,
      timestampId: generateTimestampId(),
      senderId: 'system',
      message: `${matchData.team1_name}と${matchData.team2_name}のマッチが成立しました！`,
      messageType: 'system' as const,
      createdAt: new Date().toISOString()
    };

    await chatMessageService.sendMessage(systemMessage);

    // 両チームのメンバーの既読状態を初期化
    const team1Members = await executeQuery(`
      SELECT user_id FROM team_members WHERE team_id = ?
    `, [matchData.team1_id]) as any[];

    const team2Members = await executeQuery(`
      SELECT user_id FROM team_members WHERE team_id = ?
    `, [matchData.team2_id]) as any[];

    const allMembers = [...team1Members, ...team2Members];
    
    await Promise.all(
      allMembers.map(member => 
        chatReadStatusService.updateReadStatus({
          chatRoomId,
          userId: member.user_id,
          lastReadAt: new Date().toISOString(),
          unreadCount: 0
        })
      )
    );

    return NextResponse.json({
      success: true,
      chatRoomId,
      message: 'チャットルームを作成しました'
    });

  } catch (error) {
    console.error('チャットルーム作成エラー:', error);
    return NextResponse.json(
      { error: 'チャットルーム作成エラー' },
      { status: 500 }
    );
  }
} 