const { iamClient } = require('./awsClient');

async function createManagedPolicy(policyName, policyDocument) {
  const { CreatePolicyCommand } = require('@aws-sdk/client-iam');
  
  try {
    const command = new CreatePolicyCommand({
      PolicyName: policyName,
      PolicyDocument: JSON.stringify(policyDocument),
      Description: `Managed policy for ${policyName}`,
    });

    const response = await iamClient.send(command);
    console.log(`✅ Managed policy '${policyName}' created successfully`);
    return response.Policy;
  } catch (error) {
    if (error.name === 'EntityAlreadyExistsException') {
      console.log(`⚠️ Managed policy '${policyName}' already exists`);
      return { PolicyName: policyName };
    }
    console.error(`❌ Error creating managed policy '${policyName}':`, error.message);
    throw error;
  }
}

async function createDatingAppPolicy() {
  const policyDocument = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret'
        ],
        Resource: 'arn:aws:secretsmanager:*:*:secret:dating-app/*'
      },
      {
        Effect: 'Allow',
        Action: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket'
        ],
        Resource: [
          'arn:aws:s3:::dating-app-*',
          'arn:aws:s3:::dating-app-*/*'
        ]
      },
      {
        Effect: 'Allow',
        Action: [
          'rds:DescribeDBInstances',
          'rds:DescribeDBClusters'
        ],
        Resource: '*'
      }
    ]
  };

  return await createManagedPolicy('DatingAppPolicy', policyDocument);
}

module.exports = {
  createManagedPolicy,
  createDatingAppPolicy
}; 