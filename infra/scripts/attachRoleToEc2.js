const { ec2Client } = require('./awsClient');

async function attachRoleToEc2(instanceId, roleName) {
  const { AssociateIamInstanceProfileCommand, CreateIamInstanceProfileCommand } = require('@aws-sdk/client-iam');
  const { ModifyInstanceAttributeCommand } = require('@aws-sdk/client-ec2');
  
  try {
    // First, create an instance profile if it doesn't exist
    const { CreateIamInstanceProfileCommand } = require('@aws-sdk/client-iam');
    const { iamClient } = require('./awsClient');
    
    const profileName = `${roleName}-Profile`;
    
    try {
      const createProfileCommand = new CreateIamInstanceProfileCommand({
        InstanceProfileName: profileName,
        Roles: [roleName]
      });
      
      await iamClient.send(createProfileCommand);
      console.log(`✅ Instance profile '${profileName}' created successfully`);
    } catch (error) {
      if (error.name === 'EntityAlreadyExistsException') {
        console.log(`⚠️ Instance profile '${profileName}' already exists`);
      } else {
        throw error;
      }
    }

    // Attach the instance profile to the EC2 instance
    const associateCommand = new AssociateIamInstanceProfileCommand({
      InstanceId: instanceId,
      IamInstanceProfile: {
        Name: profileName
      }
    });

    await ec2Client.send(associateCommand);
    console.log(`✅ Role '${roleName}' attached to EC2 instance '${instanceId}' successfully`);
    
  } catch (error) {
    console.error(`❌ Error attaching role to EC2 instance:`, error.message);
    throw error;
  }
}

async function attachDatingAppRoleToEc2(instanceId) {
  return await attachRoleToEc2(instanceId, 'DatingAppEC2Role');
}

module.exports = {
  attachRoleToEc2,
  attachDatingAppRoleToEc2
}; 