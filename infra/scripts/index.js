require('dotenv').config();

const secretsManager = require('./secretsManagerClient');
const { createEc2Role } = require('./createIamRole');
const { createDatingAppPolicy } = require('./createManagedPolicy');
const { attachBasicPoliciesToRole } = require('./attachPolicyToRole');
const { createDatingAppBuckets } = require('./createS3Bucket');
const { createCognitoUserPool, createCognitoIdentityPool } = require('./createCognitoUserPool');
const { createDatingAppSNSTopics } = require('./createSNSTopic');
const { createDatingAppMonitoring } = require('./createCloudWatchMonitoring');
const { createLambdaRole } = require('./createLambdaRole');
const { createDatingAppLambdaFunctions } = require('./createLambdaFunctions');
const createUserTable = require('./createUserTable');
const testConnection = require('./testConnection');
const { insertSampleData } = require('./runAuroraQuery');
const authTokenGenerator = require('./authTokenGenerator');

class ProvisioningOrchestrator {
  constructor() {
    this.steps = [];
    this.results = {};
  }

  addStep(name, stepFunction) {
    this.steps.push({ name, execute: stepFunction });
  }

  async execute() {
    console.log('🚀 Starting AWS Infrastructure Provisioning...\n');
    
    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      console.log(`\n📋 Step ${i + 1}/${this.steps.length}: ${step.name}`);
      console.log('─'.repeat(50));
      
      try {
        const result = await step.execute();
        this.results[step.name] = result;
        console.log(`✅ ${step.name} completed successfully`);
      } catch (error) {
        console.error(`❌ ${step.name} failed:`, error.message);
        console.log('\n⚠️ Provisioning stopped due to error. Please check the logs above.');
        process.exit(1);
      }
    }
    
    console.log('\n🎉 All provisioning steps completed successfully!');
    this.printSummary();
  }

  printSummary() {
    console.log('\n📊 Provisioning Summary:');
    console.log('─'.repeat(50));
    
    Object.entries(this.results).forEach(([step, result]) => {
      console.log(`✅ ${step}`);
      if (result && typeof result === 'object') {
        Object.entries(result).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }
    });
    
    console.log('\n🔑 Generated JWT Secret Key:', process.env.JWT_SECRET_KEY || 'your-secret-key');
    console.log('🌐 AWS Region:', process.env.AWS_REGION || 'us-east-1');
    console.log('\n📝 Next Steps:');
    console.log('1. Configure your application with the generated secrets');
    console.log('2. Update your .env file with the database credentials');
    console.log('3. Test the application connection to the database');
  }
}

async function main() {
  // Validate environment variables
  const requiredEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.log('Please set these variables in your .env file');
    process.exit(1);
  }

  const orchestrator = new ProvisioningOrchestrator();

  // Step 1: Create database secrets
  orchestrator.addStep('Create Database Secrets', async () => {
    const dbCredentials = {
      host: process.env.DB_HOST || 'your-aurora-cluster-endpoint',
      port: process.env.DB_PORT || 3306,
      username: process.env.DB_USERNAME || 'admin',
      password: process.env.DB_PASSWORD || 'your-secure-password',
      dbname: process.env.DB_NAME || 'dating_app'
    };

    return await secretsManager.createSecret('dating-app/db-credentials', dbCredentials);
  });

  // Step 2: Create IAM Role for EC2
  orchestrator.addStep('Create IAM Role', async () => {
    return await createEc2Role();
  });

  // Step 3: Create Managed Policy
  orchestrator.addStep('Create Managed Policy', async () => {
    return await createDatingAppPolicy();
  });

  // Step 4: Attach Policies to Role
  orchestrator.addStep('Attach Policies to Role', async () => {
    return await attachBasicPoliciesToRole('DatingAppEC2Role');
  });

  // Step 5: Create S3 Buckets
  orchestrator.addStep('Create S3 Buckets', async () => {
    return await createDatingAppBuckets();
  });

  // Step 6: Create Cognito User Pool
  orchestrator.addStep('Create Cognito User Pool', async () => {
    return await createCognitoUserPool();
  });

  // Step 7: Create Cognito Identity Pool
  orchestrator.addStep('Create Cognito Identity Pool', async () => {
    return await createCognitoIdentityPool();
  });

  // Step 8: Create SNS Topics
  orchestrator.addStep('Create SNS Topics', async () => {
    return await createDatingAppSNSTopics();
  });

  // Step 9: Create CloudWatch Monitoring
  orchestrator.addStep('Create CloudWatch Monitoring', async () => {
    return await createDatingAppMonitoring();
  });

  // Step 10: Create Lambda IAM Role
  orchestrator.addStep('Create Lambda IAM Role', async () => {
    return await createLambdaRole();
  });

  // Step 11: Create Lambda Functions
  orchestrator.addStep('Create Lambda Functions', async () => {
    return await createDatingAppLambdaFunctions();
  });

  // Step 12: Test Database Connection
  orchestrator.addStep('Test Database Connection', async () => {
    return await testConnection();
  });

  // Step 12: Create Database Tables
  orchestrator.addStep('Create Database Tables', async () => {
    return await createUserTable();
  });

  // Step 13: Insert Sample Data
  orchestrator.addStep('Insert Sample Data', async () => {
    return await insertSampleData();
  });

  // Step 14: Generate Test Tokens
  orchestrator.addStep('Generate Test Tokens', async () => {
    const userToken = authTokenGenerator.generateUserToken('test-user-123');
    const adminToken = authTokenGenerator.generateAdminToken('admin-123');
    
    return {
      userToken: userToken.substring(0, 50) + '...',
      adminToken: adminToken.substring(0, 50) + '...',
      tokenExpiry: process.env.JWT_EXPIRES_IN || '24h'
    };
  });

  // Execute all steps
  await orchestrator.execute();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { ProvisioningOrchestrator, main }; 