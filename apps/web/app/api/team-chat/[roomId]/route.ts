import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../../utils/api';
import { chatMessages, saveChatMessage } from '../../../../utils/local-nosql';
import { prisma } from '@/prisma';

// チーム内チャットメッセージを取得
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

    // チームチャットルームにアクセス権限があるかチェック
    const teamUuid = roomId.replace('team_chat_', '');

    // チームの存在とアクティブ状態を確認
    const team = await prisma.team.findFirst({
      where: {
        uuid: teamUuid,
        is_active: true
      }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'チームが見つからないか、アクティブではありません' },
        { status: 404 }
      );
    }

    // チームメンバーの権限を確認
    const userTeam = await prisma.teamMember.findFirst({
      where: {
        team_id: team.id,
        user_id: parseInt(currentUserId),
        status: 0,
        is_active: true
      }
    });

    if (!userTeam) {
      return NextResponse.json(
        { error: 'チームメンバーではありません。チームに参加してからご利用ください。' },
        { status: 403 }
      );
    }

    // NoSQLストレージからメッセージを取得
    let messages: any[] = [];

    try {
      const dbMessages = await chatMessages.findMany({
        chatRoomId: roomId
      });

      // メッセージにユーザー情報を追加
      messages = dbMessages.map((msg) => {
        if (msg.senderId === 'system') {
          return {
            ...msg,
            senderName: 'システム',
            senderAvatar: null
          };
        }

        return {
          ...msg,
          senderName: 'Unknown', // TODO: ユーザー情報を取得
          senderAvatar: null
        };
      });

      console.log('✅ チームチャットメッセージ取得完了:', messages.length);
    } catch (error) {
      console.log('⚠️ チームチャットメッセージ取得失敗、空のメッセージ配列を返す:', error);
      // フォールバック: 空のメッセージ配列を返す
      messages = [];
    }

    return NextResponse.json({
      success: true,
      messages: messages
    });

  } catch (error) {
    console.error('チームチャットメッセージ取得エラー:', error);
    return NextResponse.json(
      { error: 'チームチャットメッセージ取得エラー' },
      { status: 500 }
    );
  }
}

// チーム内チャットメッセージを送信
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

    // チームチャットルームにアクセス権限があるかチェック
    const teamUuid = roomId.replace('team_chat_', '');

    // チームの存在とアクティブ状態を確認
    const team = await prisma.team.findFirst({
      where: {
        uuid: teamUuid,
        is_active: true
      }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'チームが見つからないか、アクティブではありません' },
        { status: 404 }
      );
    }

    // チームメンバーの権限を確認
    const userTeam = await prisma.teamMember.findFirst({
      where: {
        team_id: team.id,
        user_id: parseInt(currentUserId),
        status: 0,
        is_active: true
      }
    });

    if (!userTeam) {
      return NextResponse.json(
        { error: 'チームメンバーではありません。チームに参加してからご利用ください。' },
        { status: 403 }
      );
    }

    // メッセージをNoSQLストレージに保存
    const savedMessage = await saveChatMessage(roomId, {
      senderId: currentUserId,
      content: message,
      type: messageType
    });

    const chatMessage = {
      chatRoomId: roomId,
      timestampId: savedMessage.id,
      senderId: currentUserId,
      message,
      messageType: messageType as 'text' | 'image' | 'system',
      createdAt: savedMessage.createdAt,
      senderName: 'Unknown', // TODO: ユーザー情報を取得
      senderAvatar: null
    };

    console.log('✅ チームチャットメッセージをNoSQLストレージに保存完了');

    return NextResponse.json({
      success: true,
      message: 'メッセージを送信しました',
      chatMessage
    });

  } catch (error) {
    console.error('チームチャットメッセージ送信エラー:', error);
    return NextResponse.json(
      { error: 'チームチャットメッセージ送信エラー' },
      { status: 500 }
    );
  }
}
