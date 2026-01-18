import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../../utils/api';
import { executeQuery } from '../../../../utils/database';

// 会いたい意思表示の同意を管理
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { roomId } = await params;
    const { consent } = await req.json();

    if (typeof consent !== 'boolean') {
      return NextResponse.json(
        { error: 'consentはboolean型である必要があります' },
        { status: 400 }
      );
    }

    // チャットルームにアクセス権限があるかチェック
    const matchId = roomId.replace('chat_', '');
    const userMatch = await executeQuery(`
      SELECT m.id, m.from_group_id, m.to_group_id, m.status
      FROM team_matching_flows m
      JOIN team_members tm1 ON m.from_group_id = tm1.team_id
      JOIN team_members tm2 ON m.to_group_id = tm2.team_id
      WHERE m.id = ? AND (tm1.user_id = ? OR tm2.user_id = ?)
    `, [matchId, currentUserId, currentUserId]) as any[];

    if (userMatch.length === 0) {
      return NextResponse.json(
        { error: 'チャットルームにアクセス権限がありません' },
        { status: 403 }
      );
    }

    const flow = userMatch[0];
    console.log('マッチングフロー情報:', flow);
    const userTeamId = await executeQuery(`
      SELECT team_id
      FROM team_members
      WHERE user_id = ? AND team_id IN (?, ?) AND is_active = TRUE
      LIMIT 1
    `, [currentUserId, flow.from_group_id, flow.to_group_id]) as any[];

    if (userTeamId.length === 0) {
      return NextResponse.json(
        { error: 'アクティブなチームが見つかりません' },
        { status: 403 }
      );
    }

    // 既存の同意レコードがあるかチェック
    const existingConsent = await executeQuery(`
      SELECT id FROM group_member_judgements
      WHERE chatId = ? AND userId = ?
    `, [roomId, currentUserId]) as any[];

    if (existingConsent.length > 0) {
      // 更新
      await executeQuery(`
        UPDATE group_member_judgements
        SET consent = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE chatId = ? AND userId = ?
      `, [consent, roomId, currentUserId]);
    } else {
      // 新規作成
      await executeQuery(`
        INSERT INTO group_member_judgements (chatId, userId, groupId, consent, updatedAt)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [roomId, currentUserId, userTeamId[0].team_id, consent]);
    }

    // 全メンバーの同意状況を取得
    const allConsents = await executeQuery(`
      SELECT
        tm.team_id,
        COUNT(DISTINCT tm.user_id) as total_members,
        COUNT(DISTINCT CASE WHEN gmj.consent = true AND gmj.chatId = ? THEN gmj.userId END) as consenting_members
      FROM team_members tm
      LEFT JOIN group_member_judgements gmj ON tm.user_id = gmj.userId
      WHERE tm.team_id IN (?, ?) AND tm.is_active = TRUE
      GROUP BY tm.team_id
    `, [roomId, flow.from_group_id, flow.to_group_id]) as any[];

    // 両チームの全メンバーが同意しているかチェック
    const isCompleted = allConsents.every((team: any) => team.total_members === team.consenting_members);

    // 全員が同意したらチャットステータスを更新
    if (isCompleted && consent) {
      // マッチングフローのステータスを更新（schedulingへ）
      await executeQuery(`
        UPDATE team_matching_flows
        SET status = 4, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [matchId]);
    }

    // BigIntをNumberに変換してJSONシリアライズ可能にする
    const normalizeForJSON = (obj: any): any => {
      if (typeof obj === 'bigint') {
        return Number(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(normalizeForJSON);
      }
      if (obj && typeof obj === 'object') {
        const normalized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          normalized[key] = normalizeForJSON(value);
        }
        return normalized;
      }
      return obj;
    };

    return NextResponse.json({
      success: true,
      consent,
      isCompleted,
      teams: normalizeForJSON(allConsents)
    });

  } catch (error) {
    console.error('同意更新エラー:', error);
    return NextResponse.json(
      { error: '同意更新エラー' },
      { status: 500 }
    );
  }
}

// ローカル開発用のインメモリメッセージ保管（DBテーブルが無い場合のフォールバック）
const inMemoryChatStore: Map<string, any[]> = new Map();

// チャットメッセージを取得
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { roomId } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // チャットルームにアクセス権限があるかチェック
    const matchId = roomId.replace('chat_', '');
    const userMatch = await executeQuery(`
      SELECT m.id
      FROM team_matching_flows m
      JOIN team_members tm1 ON m.from_group_id = tm1.team_id
      JOIN team_members tm2 ON m.to_group_id = tm2.team_id
      WHERE m.id = ? AND (tm1.user_id = ? OR tm2.user_id = ?)
      AND m.status = 3
    `, [matchId, currentUserId, currentUserId]) as any[];

    if (userMatch.length === 0) {
      return NextResponse.json(
        { error: 'チャットルームにアクセス権限がありません' },
        { status: 403 }
      );
    }

    // データベースからメッセージを取得
    let messages: any[] = [];
    
    try {
      const dbMessages = await executeQuery(`
        SELECT 
          id,
          chat_room_id as chatRoomId,
          sender_id as senderId,
          message,
          message_type as messageType,
          created_at as createdAt
        FROM chat_messages
        WHERE chat_room_id = ?
        ORDER BY created_at ASC
        LIMIT ${limit}
      `, [roomId]) as any[];

      // ユーザー情報を一括取得
      const uniqueUserIds = [...new Set(dbMessages.map(msg => msg.senderId).filter(id => id !== 'system'))];
      let userInfoMap = new Map();
      
      if (uniqueUserIds.length > 0) {
        const placeholders = uniqueUserIds.map(() => '?').join(',');
        const users = await executeQuery(`
          SELECT id, username, avatar_url
          FROM users
          WHERE id IN (${placeholders})
        `, uniqueUserIds) as any[];
        
        // ユーザー情報をマップに変換
        users.forEach(user => {
          userInfoMap.set(user.id, {
            username: user.username,
            avatar_url: user.avatar_url
          });
        });
      }
      
      // メッセージにユーザー情報を追加
      messages = dbMessages.map((msg) => {
        if (msg.senderId === 'system') {
          return {
            ...msg,
            senderName: 'システム',
            senderAvatar: null
          };
        }

        const userInfo = userInfoMap.get(msg.senderId);
        return {
          ...msg,
          senderName: userInfo?.username || 'Unknown',
          senderAvatar: userInfo?.avatar_url || null
        };
      });

      console.log('✅ データベースからメッセージ取得完了:', messages.length);
    } catch (error) {
      console.log('⚠️ データベースメッセージ取得失敗、システムメッセージを返す:', error);
      // フォールバック: システムメッセージのみ
      messages = [
        {
          chatRoomId: roomId,
          timestampId: 'welcome_1',
          senderId: 'system',
          message: 'マッチング成立おめでとうございます！チャットを開始しましょう。',
          messageType: 'system',
          createdAt: new Date().toISOString(),
          senderName: 'システム',
          senderAvatar: null
        }
      ];
    }

    // インメモリ保管分をマージ（DBが無いローカル時にも送受信を表示）
    const memMessages = inMemoryChatStore.get(roomId) || [];
    if (memMessages.length > 0) {
      messages = [...messages, ...memMessages]
        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    return NextResponse.json({
      success: true,
      messages: messages
    });

  } catch (error) {
    console.error('チャットメッセージ取得エラー:', error);
    return NextResponse.json(
      { error: 'チャットメッセージ取得エラー' },
      { status: 500 }
    );
  }
}

// チャットメッセージを送信
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { roomId } = await params;
    const { message, messageType = 'text' } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'メッセージが必要です' },
        { status: 400 }
      );
    }

    // チャットルームにアクセス権限があるかチェック
    const matchId = roomId.replace('chat_', '');
    const userMatch = await executeQuery(`
      SELECT m.id
      FROM team_matching_flows m
      JOIN team_members tm1 ON m.from_group_id = tm1.team_id
      JOIN team_members tm2 ON m.to_group_id = tm2.team_id
      WHERE m.id = ? AND (tm1.user_id = ? OR tm2.user_id = ?)
      AND m.status = 3
    `, [matchId, currentUserId, currentUserId]) as any[];

    if (userMatch.length === 0) {
      return NextResponse.json(
        { error: 'チャットルームにアクセス権限がありません' },
        { status: 403 }
      );
    }

    const timestampId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();

    // データベースにメッセージを保存
    try {
      await executeQuery(`
        INSERT INTO chat_messages (
          id, chat_room_id, sender_id, message, message_type, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [timestampId, roomId, currentUserId, message, messageType, createdAt]);

      console.log('✅ メッセージをデータベースに保存完了');
    } catch (error) {
      console.log('⚠️ データベース保存失敗、フォールバック:', error);
      // フォールバック: 保存はスキップ
    }

    // 送信者情報を取得
    const user = await executeQuery(`
      SELECT username, avatar_url
      FROM users
      WHERE id = ?
    `, [currentUserId]) as any[];

    const chatMessage = {
      chatRoomId: roomId,
      timestampId,
      senderId: currentUserId,
      message,
      messageType: messageType as 'text' | 'image' | 'system',
      createdAt,
      senderName: user[0]?.username || 'Unknown',
      senderAvatar: user[0]?.avatar_url || null
    };

    // インメモリにも保存（ローカル開発時の表示を保証）
    if (!inMemoryChatStore.has(roomId)) {
      inMemoryChatStore.set(roomId, []);
    }
    inMemoryChatStore.get(roomId)!.push(chatMessage);

    return NextResponse.json({
      success: true,
      message: 'メッセージを送信しました',
      chatMessage
    });

  } catch (error) {
    console.error('チャットメッセージ送信エラー:', error);
    return NextResponse.json(
      { error: 'チャットメッセージ送信エラー' },
      { status: 500 }
    );
  }
}
