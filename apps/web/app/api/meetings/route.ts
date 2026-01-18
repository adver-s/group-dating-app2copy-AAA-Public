import { NextRequest, NextResponse } from 'next/server';
import { ChimeSDKMeetingsClient, CreateMeetingCommand, CreateAttendeeCommand, DeleteMeetingCommand } from '@aws-sdk/client-chime-sdk-meetings';
import { getUserIdFromRequest } from '@/utils/api';

// Chime SDKクライアントの初期化
const chimeClient = new ChimeSDKMeetingsClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// 会議を作成
export async function POST(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId, externalUserId } = await req.json();

    if (!roomId || !externalUserId) {
      return NextResponse.json(
        { error: 'roomId and externalUserId are required' },
        { status: 400 }
      );
    }

    // 会議を作成
    const createMeetingCommand = new CreateMeetingCommand({
      ClientRequestToken: `${roomId}-${Date.now()}`,
      MediaRegion: process.env.AWS_REGION || 'us-east-1',
      ExternalMeetingId: roomId,
      MeetingFeatures: {
        Audio: {
          EchoReduction: 'AVAILABLE',
        },
        Video: {
          MaxResolution: 'None', // 音声のみ
        },
      },
      NotificationsConfiguration: {
        SqsQueueArn: process.env.CHIME_SQS_QUEUE_ARN, // オプション
      },
    });

    const meetingResponse = await chimeClient.send(createMeetingCommand);

    if (!meetingResponse.Meeting) {
      throw new Error('Failed to create meeting');
    }

    // 参加者を作成
    const createAttendeeCommand = new CreateAttendeeCommand({
      MeetingId: meetingResponse.Meeting.MeetingId!,
      ExternalUserId: externalUserId,
    });

    const attendeeResponse = await chimeClient.send(createAttendeeCommand);

    if (!attendeeResponse.Attendee) {
      throw new Error('Failed to create attendee');
    }

    return NextResponse.json({
      Meeting: meetingResponse.Meeting,
      Attendee: attendeeResponse.Attendee,
    });
  } catch (error) {
    console.error('Meeting creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    );
  }
}

// 会議を削除
export async function DELETE(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const meetingId = searchParams.get('meetingId');

    if (!meetingId) {
      return NextResponse.json(
        { error: 'meetingId is required' },
        { status: 400 }
      );
    }

    const deleteMeetingCommand = new DeleteMeetingCommand({
      MeetingId: meetingId,
    });

    await chimeClient.send(deleteMeetingCommand);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Meeting deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    );
  }
}
