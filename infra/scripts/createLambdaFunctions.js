const { LambdaClient, CreateFunctionCommand, UpdateFunctionCodeCommand } = require('@aws-sdk/client-lambda');
const fs = require('fs');
const path = require('path');

const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Lambda関数のコード
const notificationProcessorCode = `
const AWS = require('aws-sdk');
const sns = new AWS.SNS();

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    const { message, topicArn, userId } = event;
    
    // SNSに通知を送信
    const params = {
      TopicArn: topicArn,
      Message: message,
      Subject: 'Dating App Notification',
      MessageAttributes: {
        'UserId': {
          DataType: 'String',
          StringValue: userId || 'unknown'
        },
        'Timestamp': {
          DataType: 'String',
          StringValue: new Date().toISOString()
        }
      }
    };
    
    const result = await sns.publish(params).promise();
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        messageId: result.MessageId,
        success: true
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
`;

const imageProcessorCode = `
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    const { bucketName, key, operation } = event;
    
    if (operation === 'resize') {
      // 画像リサイズ処理（簡易版）
      const params = {
        Bucket: bucketName,
        Key: key
      };
      
      const object = await s3.getObject(params).promise();
      
      // 実際の画像処理はここで実装
      console.log('Processing image:', key);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Image processed successfully'
        })
      };
    }
    
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Invalid operation'
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
`;

const dataProcessorCode = `
const AWS = require('aws-sdk');
const mysql = require('mysql2/promise');

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    const { operation, data } = event;
    
    // DB接続
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    let result;
    
    switch (operation) {
      case 'user_stats':
        const [userStats] = await connection.execute('SELECT COUNT(*) as total_users, COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users FROM users');
        result = userStats[0];
        break;
        
      case 'match_stats':
        const [matchStats] = await connection.execute('SELECT COUNT(*) as total_matches, COUNT(CASE WHEN status = \\'confirmed\\' THEN 1 END) as confirmed_matches FROM matches');
        result = matchStats[0];
        break;
        
      default:
        throw new Error('Invalid operation');
    }
    
    await connection.end();
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
`;

async function createLambdaFunction(functionName, code, runtime = 'nodejs18.x') {
  try {
    // 一時的なZIPファイルを作成
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    const indexFile = path.join(tempDir, 'index.js');
    fs.writeFileSync(indexFile, code);
    
    const { execSync } = require('child_process');
    const zipFile = path.join(tempDir, 'function.zip');
    
    // ZIPファイルを作成
    execSync(`cd ${tempDir} && zip -r function.zip index.js`);
    
    const zipBuffer = fs.readFileSync(zipFile);
    
    const createFunctionCommand = new CreateFunctionCommand({
      FunctionName: functionName,
      Runtime: runtime,
      Role: 'arn:aws:iam::307946634720:role/DatingAppLambdaRole', // Lambda専用ロールを使用
      Handler: 'index.handler',
      Code: {
        ZipFile: zipBuffer
      },
      Environment: {
        Variables: {
          DB_HOST: process.env.DB_HOST,
          DB_USERNAME: process.env.DB_USERNAME,
          DB_PASSWORD: process.env.DB_PASSWORD,
          DB_NAME: process.env.DB_NAME
        }
      },
      Timeout: 30,
      MemorySize: 128
    });

    const response = await lambdaClient.send(createFunctionCommand);
    console.log(`✅ Lambda function '${functionName}' created: ${response.FunctionArn}`);
    
    // 一時ファイルを削除
    fs.unlinkSync(indexFile);
    fs.unlinkSync(zipFile);
    fs.rmdirSync(tempDir);
    
    return response.FunctionArn;
  } catch (error) {
    if (error.name === 'ResourceConflictException') {
      console.log(`⚠️ Lambda function '${functionName}' already exists`);
      return `arn:aws:lambda:${process.env.AWS_REGION || 'ap-northeast-1'}:307946634720:function:${functionName}`;
    }
    console.error(`❌ Error creating Lambda function '${functionName}':`, error.message);
    throw error;
  }
}

async function createDatingAppLambdaFunctions() {
  const functions = [
    {
      name: 'dating-app-notification-processor',
      code: notificationProcessorCode,
      description: 'Process notifications and send via SNS'
    },
    {
      name: 'dating-app-image-processor',
      code: imageProcessorCode,
      description: 'Process uploaded images'
    },
    {
      name: 'dating-app-data-processor',
      code: dataProcessorCode,
      description: 'Process data analytics'
    }
  ];

  const createdFunctions = [];
  
  for (const func of functions) {
    try {
      const functionArn = await createLambdaFunction(func.name, func.code);
      createdFunctions.push({
        name: func.name,
        arn: functionArn,
        description: func.description
      });
    } catch (error) {
      console.error(`Failed to create function ${func.name}:`, error.message);
    }
  }

  return createdFunctions;
}

module.exports = {
  createLambdaFunction,
  createDatingAppLambdaFunctions
}; 