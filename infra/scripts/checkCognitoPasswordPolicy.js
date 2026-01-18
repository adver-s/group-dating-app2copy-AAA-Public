require('dotenv').config();
const { CognitoIdentityProviderClient, DescribeUserPoolCommand } = require('@aws-sdk/client-cognito-identity-provider');

async function checkCognitoPasswordPolicy() {
  try {
    const cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    console.log('🔍 Checking Cognito User Pool password policy...');
    
    const command = new DescribeUserPoolCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID
    });

    const response = await cognitoClient.send(command);
    const userPool = response.UserPool;

    console.log('📋 User Pool Details:');
    console.log(`  - Name: ${userPool.Name}`);
    console.log(`  - ID: ${userPool.Id}`);
    
    if (userPool.Policies && userPool.Policies.PasswordPolicy) {
      const passwordPolicy = userPool.Policies.PasswordPolicy;
      console.log('🔐 Password Policy:');
      console.log(`  - Minimum Length: ${passwordPolicy.MinimumLength || 'Not set'}`);
      console.log(`  - Require Uppercase: ${passwordPolicy.RequireUppercase || false}`);
      console.log(`  - Require Lowercase: ${passwordPolicy.RequireLowercase || false}`);
      console.log(`  - Require Numbers: ${passwordPolicy.RequireNumbers || false}`);
      console.log(`  - Require Symbols: ${passwordPolicy.RequireSymbols || false}`);
      console.log(`  - Temporary Password Validity: ${passwordPolicy.TemporaryPasswordValidityInDays || 'Not set'} days`);
    } else {
      console.log('⚠️  No password policy found');
    }

    console.log('✅ Cognito password policy check completed');
    
  } catch (error) {
    console.error('❌ Failed to check Cognito password policy:', error.message);
    if (error.name === 'InvalidPasswordException') {
      console.log('💡 This error indicates the password policy requirements');
    }
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  checkCognitoPasswordPolicy();
}

module.exports = { checkCognitoPasswordPolicy }; 