import { NextRequest, NextResponse } from 'next/server';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topicName, message, subject, targetArn } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // トピックARNの構築
    const topicArn = targetArn || `arn:aws:sns:${process.env.AWS_REGION || 'ap-northeast-1'}:${process.env.AWS_ACCOUNT_ID}:${topicName || 'dating-app-matches'}`;

    const publishCommand = new PublishCommand({
      TopicArn: topicArn,
      Message: message,
      Subject: subject || 'Dating App Notification',
      MessageAttributes: {
        'MessageType': {
          DataType: 'String',
          StringValue: 'notification'
        },
        'Timestamp': {
          DataType: 'String',
          StringValue: new Date().toISOString()
        }
      }
    });

    const response = await snsClient.send(publishCommand);

    return NextResponse.json({
      success: true,
      messageId: response.MessageId,
      message: 'Notification sent successfully'
    });
  } catch (error: any) {
    console.error('Notification send error:', error);
    
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
} 