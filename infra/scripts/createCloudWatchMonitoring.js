const { CloudWatchClient, PutMetricDataCommand, CreateAlarmCommand } = require('@aws-sdk/client-cloudwatch');
const { CloudWatchLogsClient, CreateLogGroupCommand, PutLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');

const cloudWatchClient = new CloudWatchClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const cloudWatchLogsClient = new CloudWatchLogsClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function createLogGroup(logGroupName) {
  try {
    const createLogGroupCommand = new CreateLogGroupCommand({
      logGroupName: logGroupName,
    });

    await cloudWatchLogsClient.send(createLogGroupCommand);
    console.log(`✅ CloudWatch Log Group created: ${logGroupName}`);
    
    return logGroupName;
  } catch (error) {
    if (error.name === 'ResourceAlreadyExistsException') {
      console.log(`⚠️ Log Group '${logGroupName}' already exists`);
      return logGroupName;
    }
    console.error(`❌ Error creating Log Group '${logGroupName}':`, error.message);
    throw error;
  }
}

async function createCloudWatchAlarm(alarmName, metricName, namespace, threshold) {
  try {
    const createAlarmCommand = new CreateAlarmCommand({
      AlarmName: alarmName,
      AlarmDescription: `Alarm for ${metricName}`,
      MetricName: metricName,
      Namespace: namespace,
      Statistic: 'Sum',
      Period: 300, // 5分
      EvaluationPeriods: 2,
      Threshold: threshold,
      ComparisonOperator: 'GreaterThanThreshold',
      ActionsEnabled: true
    });

    await cloudWatchClient.send(createAlarmCommand);
    console.log(`✅ CloudWatch Alarm created: ${alarmName}`);
    
    return alarmName;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log(`⚠️ Alarm '${alarmName}' already exists`);
      return alarmName;
    }
    console.error(`❌ Error creating Alarm '${alarmName}':`, error.message);
    throw error;
  }
}

async function putCustomMetric(metricName, value, unit = 'Count') {
  try {
    const putMetricDataCommand = new PutMetricDataCommand({
      Namespace: 'DatingApp',
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Timestamp: new Date(),
        },
      ],
    });

    await cloudWatchClient.send(putMetricDataCommand);
    console.log(`✅ Custom metric '${metricName}' sent: ${value}`);
  } catch (error) {
    console.error(`❌ Error sending metric '${metricName}':`, error.message);
    throw error;
  }
}

async function createDatingAppMonitoring() {
  const logGroups = [
    '/aws/dating-app/api',
    '/aws/dating-app/auth',
    '/aws/dating-app/database',
    '/aws/dating-app/notifications'
  ];

  const alarms = [
    {
      name: 'dating-app-api-errors',
      metricName: 'APIErrors',
      namespace: 'DatingApp',
      threshold: 5
    },
    {
      name: 'dating-app-db-connection-errors',
      metricName: 'DBConnectionErrors',
      namespace: 'DatingApp',
      threshold: 3
    },
    {
      name: 'dating-app-high-latency',
      metricName: 'APILatency',
      namespace: 'DatingApp',
      threshold: 1000
    }
  ];

  // Log Groupsの作成
  const createdLogGroups = [];
  for (const logGroupName of logGroups) {
    try {
      const logGroup = await createLogGroup(logGroupName);
      createdLogGroups.push(logGroup);
    } catch (error) {
      console.error(`Failed to create log group ${logGroupName}:`, error.message);
    }
  }

  // Alarmsの作成
  const createdAlarms = [];
  for (const alarm of alarms) {
    try {
      const alarmName = await createCloudWatchAlarm(
        alarm.name,
        alarm.metricName,
        alarm.namespace,
        alarm.threshold
      );
      createdAlarms.push(alarmName);
    } catch (error) {
      console.error(`Failed to create alarm ${alarm.name}:`, error.message);
    }
  }

  return {
    logGroups: createdLogGroups,
    alarms: createdAlarms
  };
}

module.exports = {
  createLogGroup,
  createCloudWatchAlarm,
  putCustomMetric,
  createDatingAppMonitoring
}; 