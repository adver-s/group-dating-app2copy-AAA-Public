const { iamClient } = require('./awsClient');

async function attachPolicyToRole(roleName, policyArn) {
  const { AttachRolePolicyCommand } = require('@aws-sdk/client-iam');
  
  try {
    const command = new AttachRolePolicyCommand({
      RoleName: roleName,
      PolicyArn: policyArn,
    });

    await iamClient.send(command);
    console.log(`✅ Policy '${policyArn}' attached to role '${roleName}' successfully`);
  } catch (error) {
    if (error.name === 'NoSuchEntityException') {
      console.error(`❌ Role '${roleName}' or policy '${policyArn}' not found`);
    } else {
      console.error(`❌ Error attaching policy to role:`, error.message);
    }
    throw error;
  }
}

async function attachDatingAppPolicyToRole(roleName) {
  const policyArn = 'arn:aws:iam::aws:policy/DatingAppPolicy';
  return await attachPolicyToRole(roleName, policyArn);
}

async function attachBasicPoliciesToRole(roleName) {
  const basicPolicies = [
    'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
    'arn:aws:iam::aws:policy/SecretsManagerReadWrite'
  ];

  for (const policyArn of basicPolicies) {
    try {
      await attachPolicyToRole(roleName, policyArn);
    } catch (error) {
      console.log(`⚠️ Could not attach ${policyArn} to ${roleName}: ${error.message}`);
    }
  }
}

module.exports = {
  attachPolicyToRole,
  attachDatingAppPolicyToRole,
  attachBasicPoliciesToRole
}; 