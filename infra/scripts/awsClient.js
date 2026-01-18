const { EC2Client } = require('@aws-sdk/client-ec2');
const { IAMClient } = require('@aws-sdk/client-iam');
const { S3Client } = require('@aws-sdk/client-s3');
const { SecretsManagerClient } = require('@aws-sdk/client-secrets-manager');

// AWS Configuration
const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

// Initialize AWS clients
const ec2Client = new EC2Client(awsConfig);
const iamClient = new IAMClient(awsConfig);
const s3Client = new S3Client(awsConfig);
const secretsManagerClient = new SecretsManagerClient(awsConfig);

module.exports = {
  ec2Client,
  iamClient,
  s3Client,
  secretsManagerClient,
}; 