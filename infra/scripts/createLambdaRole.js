const { IAMClient, CreateRoleCommand, AttachRolePolicyCommand } = require('@aws-sdk/client-iam');

const iamClient = new IAMClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function createLambdaRole() {
  try {
    const trustPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com'
          },
          Action: 'sts:AssumeRole'
        }
      ]
    };

    const createRoleCommand = new CreateRoleCommand({
      RoleName: 'DatingAppLambdaRole',
      AssumeRolePolicyDocument: JSON.stringify(trustPolicy),
      Description: 'Role for Dating App Lambda functions'
    });

    const response = await iamClient.send(createRoleCommand);
    console.log(`✅ Lambda IAM Role created: ${response.Role.Arn}`);

    // Lambda実行ポリシーをアタッチ
    const attachPolicyCommand = new AttachRolePolicyCommand({
      RoleName: 'DatingAppLambdaRole',
      PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
    });

    await iamClient.send(attachPolicyCommand);
    console.log('✅ Lambda basic execution policy attached');

    // S3アクセスポリシーをアタッチ
    const attachS3PolicyCommand = new AttachRolePolicyCommand({
      RoleName: 'DatingAppLambdaRole',
      PolicyArn: 'arn:aws:iam::aws:policy/AmazonS3FullAccess'
    });

    await iamClient.send(attachS3PolicyCommand);
    console.log('✅ S3 access policy attached');

    // SNSアクセスポリシーをアタッチ
    const attachSNSPolicyCommand = new AttachRolePolicyCommand({
      RoleName: 'DatingAppLambdaRole',
      PolicyArn: 'arn:aws:iam::aws:policy/AmazonSNSFullAccess'
    });

    await iamClient.send(attachSNSPolicyCommand);
    console.log('✅ SNS access policy attached');

    return response.Role.Arn;
  } catch (error) {
    if (error.name === 'EntityAlreadyExistsException') {
      console.log('⚠️ Lambda IAM Role already exists');
      return 'arn:aws:iam::307946634720:role/DatingAppLambdaRole';
    }
    console.error('❌ Error creating Lambda IAM Role:', error.message);
    throw error;
  }
}

module.exports = {
  createLambdaRole
}; 