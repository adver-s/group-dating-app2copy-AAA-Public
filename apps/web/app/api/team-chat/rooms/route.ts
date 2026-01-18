import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../../utils/api';
import { chatMessages, saveChatMessage } from '../../../../utils/local-nosql';
import { prisma } from '@/prisma';

// ユーザーが参加しているチームのチャットルーム一覧を取得
export async function GET(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // ユーザーが参加しているアクティブなチームを取得
    const userTeams = await prisma.teamMember.findMany({
      where: {
        user_id: parseInt(currentUserId),
        status: 0,
        team: {
          is_active: true
        }
      },
      include: {
        team: true
      },
      orderBy: [
        { team: { created_at: 'desc' } }
      ]
    });

    // 各チームの最新メッセージを取得
    const chatRooms = await Promise.all(
      userTeams.map(async (teamMember) => {
        let lastMessage = null;

        // チームチャットの最新メッセージを取得
        const teamChatRoomId = `team_chat_${teamMember.team.uuid}`;
        const messages = await chatMessages.findMany({
          chatRoomId: teamChatRoomId
        });

        if (messages.length > 0) {
          const latestMessage = messages[messages.length - 1];
          lastMessage = {
            id: latestMessage.id,
            text: latestMessage.content,
            senderId: latestMessage.senderId,
            senderName: 'Unknown', // TODO: ユーザー情報を取得
            senderAvatar: null,
            timestamp: latestMessage.createdAt
          };
        }

        return {
          id: teamChatRoomId,
          teamId: teamMember.team.uuid,
          name: teamMember.team.name,
          description: teamMember.team.description,
          lastMessage,
          unreadCount: 0, // TODO: 未読数を計算
          createdAt: teamMember.team.created_at,
          hasChatRoom: true
        };
      })
    );

    return NextResponse.json({
      success: true,
      chatRooms
    });

  } catch (error) {
    console.error('チームチャットルーム取得エラー:', error);
    return NextResponse.json(
      { error: 'チームチャットルーム取得エラー' },
      { status: 500 }
    );
  }
}

// チームチャットルームの初期メッセージを作成（チーム作成時に自動的に呼ばれる）
export async function POST(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { teamId } = await req.json();

    if (!teamId) {
      return NextResponse.json(
        { error: 'チームIDが必要です' },
        { status: 400 }
      );
    }

    // チームの存在とアクティブ状態を確認
    const team = await prisma.team.findFirst({
      where: {
        uuid: teamId,
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

    // チームチャットルームのID（決定的IDを採用）
    const chatRoomId = `team_chat_${teamId}`;

    // 初期システムメッセージをNoSQLストレージに保存
    await saveChatMessage(chatRoomId, {
      senderId: 'system',
      content: 'チームメンバーの皆さん、こんにちは！チームでの連絡にご利用ください。',
      type: 'system'
    });

    return NextResponse.json({
      success: true,
      chatRoomId,
      message: 'チームチャットルームを準備しました'
    });

  } catch (error) {
    console.error('チームチャットルーム作成エラー:', error);
    return NextResponse.json(
      { error: 'チームチャットルーム作成エラー' },
      { status: 500 }
    );
  }
}
