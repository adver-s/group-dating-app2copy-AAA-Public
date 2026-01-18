#!/usr/bin/env node

const { EC2Client, StartInstancesCommand, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');

async function startInstance(instanceId) {
  try {
    const ec2Client = new EC2Client({
      region: process.env.AWS_REGION || 'ap-northeast-1'
    });

    console.log(`🚀 インスタンス ${instanceId} を起動中...\n`);

    // 起動コマンド
    const startCommand = new StartInstancesCommand({
      InstanceIds: [instanceId]
    });

    const startResponse = await ec2Client.send(startCommand);
    console.log('✅ 起動コマンドを送信しました');

    // 起動状態を監視
    console.log('⏳ 起動状態を監視中...');

    let attempts = 0;
    const maxAttempts = 30; // 5分間監視

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10秒待機

      const describeCommand = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });

      const describeResponse = await ec2Client.send(describeCommand);

      if (describeResponse.Reservations && describeResponse.Reservations.length > 0) {
        const instance = describeResponse.Reservations[0].Instances[0];

        console.log(`  状態: ${instance.State.Name}`);

        if (instance.State.Name === 'running') {
          console.log('\n🎉 インスタンスが正常に起動しました！');

          // IPアドレスの情報を表示
          console.log(`📋 インスタンス情報:`);
          console.log(`  ID: ${instance.InstanceId}`);
          console.log(`  状態: ${instance.State.Name}`);
          console.log(`  パブリックIP: ${instance.PublicIpAddress || '取得中...'}`);
          console.log(`  プライベートIP: ${instance.PrivateIpAddress}`);

          // Elastic IPの確認
          if (instance.NetworkInterfaces && instance.NetworkInterfaces.length > 0) {
            const networkInterface = instance.NetworkInterfaces[0];
            if (networkInterface.Association && networkInterface.Association.PublicIp) {
              console.log(`  Elastic IP: ${networkInterface.Association.PublicIp}`);
              console.log(`\n🌐 アクセスURL: http://${networkInterface.Association.PublicIp}:3000`);
            }
          }

          // パブリックIPがある場合
          if (instance.PublicIpAddress) {
            console.log(`\n🌐 アクセスURL: http://${instance.PublicIpAddress}:3000`);
          }

          console.log(`\n⏰ 起動時間: ${instance.LaunchTime}`);
          console.log(`  インスタンスタイプ: ${instance.InstanceType}`);

          // セキュリティグループの確認
          console.log(`\n🔒 セキュリティグループ:`);
          instance.SecurityGroups.forEach((sg, index) => {
            console.log(`  ${index + 1}. ${sg.GroupName} (${sg.GroupId})`);
          });

          return;
        }
      }

      attempts++;
      console.log(`  試行回数: ${attempts}/${maxAttempts}`);
    }

    console.log('\n⏰ 起動監視を終了しました。AWSマネジメントコンソールで状態を確認してください。');

  } catch (error) {
    console.error('❌ エラー:', error.message);

    if (error.name === 'UnauthorizedOperation') {
      console.log('\n💡 AWS認証情報に問題がある可能性があります');
      console.log('IAMユーザーにEC2の起動権限があるか確認してください');
    }
  }
}

// コマンドライン引数からインスタンスIDを取得
const targetInstanceId = process.argv[2] || 'i-0b57e0907ae360d2c';

console.log(`🔧 対象インスタンス: ${targetInstanceId}\n`);
startInstance(targetInstanceId);















