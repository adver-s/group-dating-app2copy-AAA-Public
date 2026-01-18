import { NextRequest, NextResponse } from 'next/server';
import { ChimeSDKMeetingsClient, CreateAttendeeCommand, DeleteAttendeeCommand } from '@aws-sdk/client-chime-sdk-meetings';
import { getUserIdFromRequest } from '@/utils/api';

// Chime SDKクライアントの初期化
const chimeClient = new ChimeSDKMeetingsClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// 参加者を作成
export async function POST(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meetingId, externalUserId } = await req.json();

    if (!meetingId || !externalUserId) {
      return NextResponse.json(
        { error: 'meetingId and externalUserId are required' },
        { status: 400 }
      );
    }

    // 参加者を作成
    const createAttendeeCommand = new CreateAttendeeCommand({
      MeetingId: meetingId,
      ExternalUserId: externalUserId,
    });

    const attendeeResponse = await chimeClient.send(createAttendeeCommand);

    if (!attendeeResponse.Attendee) {
      throw new Error('Failed to create attendee');
    }

    return NextResponse.json({
      Attendee: attendeeResponse.Attendee,
    });
  } catch (error) {
    console.error('Attendee creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create attendee' },
      { status: 500 }
    );
  }
}

// 参加者を削除
export async function DELETE(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const meetingId = searchParams.get('meetingId');
    const attendeeId = searchParams.get('attendeeId');

    if (!meetingId || !attendeeId) {
      return NextResponse.json(
        { error: 'meetingId and attendeeId are required' },
        { status: 400 }
      );
    }

    const deleteAttendeeCommand = new DeleteAttendeeCommand({
      MeetingId: meetingId,
      AttendeeId: attendeeId,
    });

    await chimeClient.send(deleteAttendeeCommand);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Attendee deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete attendee' },
      { status: 500 }
    );
  }
}
