import { NextRequest, NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { functionName, payload } = body;

    if (!functionName) {
      return NextResponse.json(
        { error: 'functionName is required' },
        { status: 400 }
      );
    }

    const invokeCommand = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload || {}),
      InvocationType: 'RequestResponse', // 同期実行
    });

    const response = await lambdaClient.send(invokeCommand);
    
    // レスポンスをデコード
    const responsePayload = new TextDecoder().decode(response.Payload);
    const result = JSON.parse(responsePayload);

    return NextResponse.json({
      success: true,
      result: result,
      statusCode: response.StatusCode,
    });
  } catch (error: any) {
    console.error('Lambda invoke error:', error);
    
    return NextResponse.json(
      { error: 'Failed to invoke Lambda function' },
      { status: 500 }
    );
  }
} 