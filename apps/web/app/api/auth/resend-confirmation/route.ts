import { CognitoIdentityProviderClient, ResendConfirmationCodeCommand } from '@aws-sdk/client-cognito-identity-provider';
import { NextRequest, NextResponse } from 'next/server';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const resendConfirmationCodeCommand = new ResendConfirmationCodeCommand({
      ClientId: process.env['COGNITO_CLIENT_ID'],
      Username: email,
    });

    await cognitoClient.send(resendConfirmationCodeCommand);

    return NextResponse.json({
      success: true,
      message: 'Confirmation code resent successfully',
    });
  } catch (error: any) {
    console.error('Resend confirmation error:', error);

    if (error.name === 'UserNotFoundException') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (error.name === 'InvalidParameterException') {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (error.name === 'LimitExceededException') {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to resend confirmation code' },
      { status: 500 }
    );
  }
} 