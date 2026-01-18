require('dotenv').config();
const { CognitoIdentityProviderClient, DescribeUserPoolCommand } = require('@aws-sdk/client-cognito-identity-provider');

async function checkCognitoAttributes() {
  try {
    const cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    console.log('🔍 Checking Cognito User Pool custom attributes...');
    
    const command = new DescribeUserPoolCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID
    });

    const response = await cognitoClient.send(command);
    const userPool = response.UserPool;

    console.log('📋 User Pool Details:');
    console.log(`  - Name: ${userPool.Name}`);
    console.log(`  - ID: ${userPool.Id}`);
    
    if (userPool.SchemaAttributes) {
      console.log('🔧 Schema Attributes:');
      userPool.SchemaAttributes.forEach(attr => {
        console.log(`  - ${attr.Name} (${attr.AttributeDataType})`);
        if (attr.Required) console.log('    Required: Yes');
        if (attr.Mutable) console.log('    Mutable: Yes');
        if (attr.NumberAttributeConstraints) {
          console.log(`    Min: ${attr.NumberAttributeConstraints.MinValue}`);
          console.log(`    Max: ${attr.NumberAttributeConstraints.MaxValue}`);
        }
        if (attr.StringAttributeConstraints) {
          console.log(`    Min Length: ${attr.StringAttributeConstraints.MinLength}`);
          console.log(`    Max Length: ${attr.StringAttributeConstraints.MaxLength}`);
        }
      });
    } else {
      console.log('⚠️  No schema attributes found');
    }

    console.log('✅ Cognito attributes check completed');
    
  } catch (error) {
    console.error('❌ Failed to check Cognito attributes:', error.message);
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  checkCognitoAttributes();
}

module.exports = { checkCognitoAttributes }; 