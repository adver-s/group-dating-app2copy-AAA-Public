const { SNSClient, CreateTopicCommand, SubscribeCommand } = require('@aws-sdk/client-sns');

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function createSNSTopic(topicName) {
  try {
    const createTopicCommand = new CreateTopicCommand({
      Name: topicName,
    });

    const response = await snsClient.send(createTopicCommand);
    console.log(`✅ SNS Topic '${topicName}' created: ${response.TopicArn}`);
    
    return response.TopicArn;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log(`⚠️ SNS Topic '${topicName}' already exists`);
      return null;
    }
    console.error(`❌ Error creating SNS Topic '${topicName}':`, error.message);
    throw error;
  }
}

async function subscribeToTopic(topicArn, protocol, endpoint) {
  try {
    const subscribeCommand = new SubscribeCommand({
      TopicArn: topicArn,
      Protocol: protocol,
      Endpoint: endpoint,
    });

    const response = await snsClient.send(subscribeCommand);
    console.log(`✅ Subscribed to topic: ${response.SubscriptionArn}`);
    
    return response.SubscriptionArn;
  } catch (error) {
    console.error('❌ Error subscribing to topic:', error.message);
    throw error;
  }
}

async function createDatingAppSNSTopics() {
  const topics = [
    'dating-app-matches',
    'dating-app-messages',
    'dating-app-events'
  ];

  const createdTopics = [];
  
  for (const topicName of topics) {
    try {
      const topicArn = await createSNSTopic(topicName);
      if (topicArn) {
        createdTopics.push({
          name: topicName,
          arn: topicArn
        });
      }
    } catch (error) {
      console.error(`Failed to create topic ${topicName}:`, error.message);
    }
  }

  return createdTopics;
}

module.exports = {
  createSNSTopic,
  subscribeToTopic,
  createDatingAppSNSTopics
}; 