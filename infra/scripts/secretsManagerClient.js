const { secretsManagerClient } = require('./awsClient');

class SecretsManagerService {
  constructor() {
    this.client = secretsManagerClient;
  }

  async createSecret(secretName, secretValue) {
    const { CreateSecretCommand } = require('@aws-sdk/client-secrets-manager');
    
    try {
      const command = new CreateSecretCommand({
        Name: secretName,
        SecretString: JSON.stringify(secretValue),
        Description: `Secret for ${secretName}`,
      });

      const response = await this.client.send(command);
      console.log(`✅ Secret '${secretName}' created successfully`);
      return response;
    } catch (error) {
      if (error.name === 'ResourceExistsException') {
        console.log(`⚠️ Secret '${secretName}' already exists`);
        return await this.updateSecret(secretName, secretValue);
      }
      console.error(`❌ Error creating secret '${secretName}':`, error.message);
      throw error;
    }
  }

  async updateSecret(secretName, secretValue) {
    const { UpdateSecretCommand } = require('@aws-sdk/client-secrets-manager');
    
    try {
      const command = new UpdateSecretCommand({
        SecretId: secretName,
        SecretString: JSON.stringify(secretValue),
      });

      const response = await this.client.send(command);
      console.log(`✅ Secret '${secretName}' updated successfully`);
      return response;
    } catch (error) {
      console.error(`❌ Error updating secret '${secretName}':`, error.message);
      throw error;
    }
  }

  async getSecret(secretName) {
    const { GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
    
    try {
      const command = new GetSecretValueCommand({
        SecretId: secretName,
      });

      const response = await this.client.send(command);
      return JSON.parse(response.SecretString);
    } catch (error) {
      console.error(`❌ Error retrieving secret '${secretName}':`, error.message);
      throw error;
    }
  }
}

module.exports = new SecretsManagerService(); 