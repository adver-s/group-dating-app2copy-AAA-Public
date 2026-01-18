const { CognitoIdentityProviderClient, DescribeUserPoolCommand } = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function checkCognitoSettings() {
  try {
    console.log('🔍 Checking Cognito User Pool settings...');
    
    const describeUserPoolCommand = new DescribeUserPoolCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
    });

    const response = await cognitoClient.send(describeUserPoolCommand);
    const userPool = response.UserPool;

    console.log('📋 User Pool Configuration:');
    console.log(`- User Pool ID: ${userPool.Id}`);
    console.log(`- Name: ${userPool.Name}`);
    console.log(`- Auto Verified Attributes: ${userPool.AutoVerifiedAttributes?.join(', ') || 'None'}`);
    console.log(`- Email Verification: ${userPool.EmailVerificationMessage || 'Not configured'}`);
    console.log(`- Email Configuration: ${userPool.EmailConfiguration ? 'Configured' : 'Not configured'}`);
    
    if (userPool.EmailConfiguration) {
      console.log(`- Email Source: ${userPool.EmailConfiguration.EmailSendingAccount}`);
      console.log(`- From Email: ${userPool.EmailConfiguration.From || 'Not set'}`);
    }

    console.log('\n📧 Email Settings:');
    console.log(`- Email Verification Required: ${userPool.EmailVerificationMessage ? 'Yes' : 'No'}`);
    console.log(`- Email Verification Message: ${userPool.EmailVerificationMessage || 'Default'}`);
    console.log(`- Email Verification Subject: ${userPool.EmailVerificationSubject || 'Default'}`);

    console.log('\n🔐 Sign-up Settings:');
    console.log(`- Admin Create User Config: ${userPool.AdminCreateUserConfig?.AllowAdminCreateUserOnly ? 'Admin only' : 'Users can sign up'}`);
    console.log(`- Auto Confirmed: ${userPool.AdminCreateUserConfig?.AutoVerifiedAttributes?.join(', ') || 'None'}`);

  } catch (error) {
    console.error('❌ Failed to check Cognito settings:', error.message);
    if (error.name === 'NotAuthorizedException') {
      console.error('💡 This might be due to insufficient permissions or incorrect credentials');
    }
  }
}

checkCognitoSettings(); 