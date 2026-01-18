const { CognitoIdentityProviderClient, CreateUserPoolCommand, CreateUserPoolClientCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { s3Client } = require('./awsClient');

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function createCognitoUserPool() {
  try {
    // ユーザープールの作成
    const createUserPoolCommand = new CreateUserPoolCommand({
      PoolName: 'dating-app-user-pool',
      Policies: {
        PasswordPolicy: {
          MinimumLength: 8,
          RequireUppercase: true,
          RequireLowercase: true,
          RequireNumbers: true,
          RequireSymbols: false,
        },
      },
      AutoVerifiedAttributes: ['email'],
      UsernameAttributes: ['email'],
      MfaConfiguration: 'OFF',
      EmailConfiguration: {
        EmailSendingAccount: 'COGNITO_DEFAULT',
      },
      Schema: [
        {
          Name: 'email',
          AttributeDataType: 'String',
          Required: true,
          Mutable: true,
        },
        {
          Name: 'name',
          AttributeDataType: 'String',
          Required: false,
          Mutable: true,
        },
        {
          Name: 'phone_number',
          AttributeDataType: 'String',
          Required: false,
          Mutable: true,
        },
      ],
    });

    const userPoolResponse = await cognitoClient.send(createUserPoolCommand);
    const userPoolId = userPoolResponse.UserPool.Id;
    
    console.log(`✅ Cognito User Pool created: ${userPoolId}`);

    // ユーザープールクライアントの作成
    const createUserPoolClientCommand = new CreateUserPoolClientCommand({
      UserPoolId: userPoolId,
      ClientName: 'dating-app-client',
      GenerateSecret: false,
      ExplicitAuthFlows: [
        'ALLOW_USER_PASSWORD_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH',
        'ALLOW_USER_SRP_AUTH',
      ],
      SupportedIdentityProviders: ['COGNITO'],
      CallbackURLs: [
        'http://localhost:3000/auth/callback',
        'https://your-domain.com/auth/callback'
      ],
      LogoutURLs: [
        'http://localhost:3000/auth/logout',
        'https://your-domain.com/auth/logout'
      ],
    });

    const clientResponse = await cognitoClient.send(createUserPoolClientCommand);
    const clientId = clientResponse.UserPoolClient.ClientId;
    
    console.log(`✅ Cognito User Pool Client created: ${clientId}`);

    return {
      userPoolId,
      clientId,
      region: process.env.AWS_REGION || 'ap-northeast-1'
    };
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log('⚠️ User Pool already exists');
      return null;
    }
    console.error('❌ Error creating Cognito User Pool:', error.message);
    throw error;
  }
}

async function createCognitoIdentityPool() {
  try {
    const { CognitoIdentityClient, CreateIdentityPoolCommand } = require('@aws-sdk/client-cognito-identity');
    
    const identityClient = new CognitoIdentityClient({
      region: process.env.AWS_REGION || 'ap-northeast-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    // まずUser Pool Client IDを取得
    const { ListUserPoolClientsCommand } = require('@aws-sdk/client-cognito-identity-provider');
    const listClientsCommand = new ListUserPoolClientsCommand({
      UserPoolId: 'ap-northeast-1_RTWuZKU7b', // 作成されたUser Pool ID
    });
    
    const clientsResponse = await cognitoClient.send(listClientsCommand);
    const clientId = clientsResponse.UserPoolClients?.[0]?.ClientId;
    
    if (!clientId) {
      throw new Error('No Cognito User Pool Client found');
    }

    // Identity Poolの作成（S3アクセス用）
    const createIdentityPoolCommand = new CreateIdentityPoolCommand({
      IdentityPoolName: 'dating-app-identity-pool',
      AllowUnauthenticatedIdentities: false,
      CognitoIdentityProviders: [
        {
          ProviderName: `cognito-idp.${process.env.AWS_REGION || 'ap-northeast-1'}.amazonaws.com/ap-northeast-1_RTWuZKU7b`,
          ClientId: clientId,
          ServerSideTokenCheck: false,
        },
      ],
    });

    const identityPoolResponse = await identityClient.send(createIdentityPoolCommand);
    const identityPoolId = identityPoolResponse.IdentityPoolId;
    
    console.log(`✅ Cognito Identity Pool created: ${identityPoolId}`);

    return identityPoolId;
  } catch (error) {
    console.error('❌ Error creating Cognito Identity Pool:', error.message);
    throw error;
  }
}

module.exports = {
  createCognitoUserPool,
  createCognitoIdentityPool
}; 