import { CognitoIdentityProviderClient, ConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
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
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and confirmation code are required' },
        { status: 400 }
      );
    }

    const confirmSignUpCommand = new ConfirmSignUpCommand({
      ClientId: process.env['COGNITO_CLIENT_ID'],
      Username: email,
      ConfirmationCode: code,
    });

    await cognitoClient.send(confirmSignUpCommand);

    return NextResponse.json({
      success: true,
      message: 'Email confirmed successfully',
    });
  } catch (error: any) {
    console.error('Confirmation error:', error);

    if (error.name === 'CodeMismatchException') {
      return NextResponse.json(
        { error: 'Invalid confirmation code' },
        { status: 400 }
      );
    }

    if (error.name === 'ExpiredCodeException') {
      return NextResponse.json(
        { error: 'Confirmation code has expired' },
        { status: 400 }
      );
    }

    if (error.name === 'NotAuthorizedException') {
      return NextResponse.json(
        { error: 'User is already confirmed' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Confirmation failed' },
      { status: 500 }
    );
  }
} 