import { NextRequest, NextResponse } from 'next/server';
import { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { executeQuery } from '../../../../utils/database';
import { getUserIdFromRequest } from '../../../../utils/api';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { username, bio, age, location, interests } = body;

    console.log('🔄 Cognito同期開始 - ユーザーID:', currentUserId);

    // 1. MySQLのプロフィール情報を更新
    const interestsJson = interests && interests.length > 0 ? JSON.stringify(interests) : null;
    
    await executeQuery(`
      UPDATE users 
      SET 
        username = ?,
        bio = ?,
        age = ?,
        location = ?,
        interests = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [username, bio, age, location, interestsJson, currentUserId]);

    console.log('✅ MySQL更新完了');

    // 2. ユーザーのemailを取得（CognitoのUsernameとして使用）
    const userInfo = await executeQuery(`
      SELECT email FROM users WHERE id = ?
    `, [currentUserId]) as any[];

    if (!userInfo || userInfo.length === 0) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    const userEmail = userInfo[0].email;

    // 3. Cognitoのユーザー情報を更新
    const userAttributes = [
      {
        Name: 'name',
        Value: username || '',
      },
      {
        Name: 'profile',
        Value: bio || '',
      },
      {
        Name: 'address',
        Value: location || '',
      },
      {
        Name: 'nickname',
        Value: interests ? interests.join(', ') : '',
      },
      {
        Name: 'gender',
        Value: age ? age.toString() : '',
      },
    ];

    const updateCommand = new AdminUpdateUserAttributesCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      Username: userEmail, // emailをUsernameとして使用
      UserAttributes: userAttributes,
    });

    await cognitoClient.send(updateCommand);
    console.log('✅ Cognito更新完了');

    return NextResponse.json({
      success: true,
      message: 'Profile synchronized with Cognito successfully'
    });

  } catch (error) {
    console.error('❌ Cognito同期エラー:', error);
    return NextResponse.json({ 
      error: 'Failed to sync with Cognito',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Cognito情報取得 - ユーザーID:', currentUserId);

    // ユーザーのemailを取得
    const userInfo = await executeQuery(`
      SELECT email FROM users WHERE id = ?
    `, [currentUserId]) as any[];

    if (!userInfo || userInfo.length === 0) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    const userEmail = userInfo[0].email;

    // Cognitoからユーザー情報を取得
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      Username: userEmail,
    });

    const cognitoUser = await cognitoClient.send(getUserCommand);
    
    console.log('✅ Cognito情報取得完了');

    return NextResponse.json({
      success: true,
      cognitoUser: {
        username: cognitoUser.Username,
        attributes: cognitoUser.UserAttributes,
        enabled: cognitoUser.Enabled,
        userStatus: cognitoUser.UserStatus,
      }
    });

  } catch (error) {
    console.error('❌ Cognito情報取得エラー:', error);
    return NextResponse.json({ 
      error: 'Failed to get Cognito user info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 