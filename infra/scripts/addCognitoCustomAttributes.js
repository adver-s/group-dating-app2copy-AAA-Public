require('dotenv').config();
const { CognitoIdentityProviderClient, UpdateUserPoolCommand } = require('@aws-sdk/client-cognito-identity-provider');

async function addCognitoCustomAttributes() {
  try {
    const cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    console.log('🔧 Adding custom attributes to Cognito User Pool...');
    
    const command = new UpdateUserPoolCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Schema: [
        {
          Name: 'custom:age',
          AttributeDataType: 'Number',
          Mutable: true,
          Required: false,
          NumberAttributeConstraints: {
            MinValue: '0',
            MaxValue: '150'
          }
        },
        {
          Name: 'custom:location',
          AttributeDataType: 'String',
          Mutable: true,
          Required: false,
          StringAttributeConstraints: {
            MinLength: '0',
            MaxLength: '100'
          }
        },
        {
          Name: 'custom:bio',
          AttributeDataType: 'String',
          Mutable: true,
          Required: false,
          StringAttributeConstraints: {
            MinLength: '0',
            MaxLength: '500'
          }
        },
        {
          Name: 'custom:interests',
          AttributeDataType: 'String',
          Mutable: true,
          Required: false,
          StringAttributeConstraints: {
            MinLength: '0',
            MaxLength: '1000'
          }
        }
      ]
    });

    await cognitoClient.send(command);
    console.log('✅ Custom attributes added successfully');
    
  } catch (error) {
    console.error('❌ Failed to add custom attributes:', error.message);
    if (error.name === 'InvalidParameterException') {
      console.log('💡 This error might indicate that the attributes already exist or there are schema conflicts');
    }
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  addCognitoCustomAttributes();
}

module.exports = { addCognitoCustomAttributes }; 