const { iamClient } = require('./awsClient');

async function createIamRole(roleName, trustPolicy) {
  const { CreateRoleCommand, AttachRolePolicyCommand } = require('@aws-sdk/client-iam');
  
  try {
    // Create the IAM role
    const createRoleCommand = new CreateRoleCommand({
      RoleName: roleName,
      AssumeRolePolicyDocument: JSON.stringify(trustPolicy),
      Description: `IAM role for ${roleName}`,
    });

    const createRoleResponse = await iamClient.send(createRoleCommand);
    console.log(`✅ IAM role '${roleName}' created successfully`);
    
    return createRoleResponse.Role;
  } catch (error) {
    if (error.name === 'EntityAlreadyExistsException') {
      console.log(`⚠️ IAM role '${roleName}' already exists`);
      return { RoleName: roleName };
    }
    console.error(`❌ Error creating IAM role '${roleName}':`, error.message);
    throw error;
  }
}

async function createEc2Role() {
  const trustPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: {
          Service: 'ec2.amazonaws.com'
        },
        Action: 'sts:AssumeRole'
      }
    ]
  };

  return await createIamRole('DatingAppEC2Role', trustPolicy);
}

module.exports = {
  createIamRole,
  createEc2Role
}; 