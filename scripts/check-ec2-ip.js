#!/usr/bin/env node

const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');

async function checkEC2Instance(instanceId) {
  try {
    // AWS設定は環境変数から取得
    const ec2Client = new EC2Client({
      region: process.env.AWS_REGION || 'ap-northeast-1'
    });

    const command = new DescribeInstancesCommand({
      InstanceIds: [instanceId]
    });

    const response = await ec2Client.send(command);

    if (response.Reservations && response.Reservations.length > 0) {
      const instance = response.Reservations[0].Instances[0];

      console.log(`📋 インスタンス情報:`);
      console.log(`ID: ${instance.InstanceId}`);
      console.log(`状態: ${instance.State.Name}`);
      console.log(`パブリックIP: ${instance.PublicIpAddress || 'なし'}`);
      console.log(`プライベートIP: ${instance.PrivateIpAddress || 'なし'}`);

      // Elastic IPの確認
      if (instance.NetworkInterfaces && instance.NetworkInterfaces.length > 0) {
        const networkInterface = instance.NetworkInterfaces[0];
        if (networkInterface.Association) {
          console.log(`🌐 Elastic IP: ${networkInterface.Association.PublicIp}`);
          console.log(`✅ Elastic IPが設定されているため、停止・再起動してもIPは変わりません！`);
        } else {
          console.log(`⚠️  Elastic IPが設定されていません`);
          console.log(`🔄 停止・再起動するとパブリックIPが変わる可能性があります`);
        }
      }

      // 現在のアクセスURL
      if (instance.PublicIpAddress) {
        console.log(`\n🔗 現在のアクセスURL: http://${instance.PublicIpAddress}:3000`);
      } else if (networkInterface && networkInterface.Association && networkInterface.Association.PublicIp) {
        console.log(`\n🔗 現在のアクセスURL: http://${networkInterface.Association.PublicIp}:3000`);
      } else {
        console.log(`\n❌ パブリックIPが見つかりません`);
      }

    } else {
      console.log(`❌ インスタンス ${instanceId} が見つかりません`);
    }

  } catch (error) {
    console.error('❌ エラー:', error.message);
    console.log('\n💡 解決方法:');
    console.log('1. AWS CLIがインストールされているか確認: aws --version');
    console.log('2. AWS認証情報が設定されているか確認: aws configure list');
    console.log('3. 環境変数 AWS_ACCESS_KEY_ID と AWS_SECRET_ACCESS_KEY が設定されているか確認');
    console.log('4. 正しいリージョン（ap-northeast-1）が設定されているか確認');
  }
}

// コマンドライン引数からインスタンスIDを取得
const instanceId = process.argv[2] || 'i-0b57e0907ae360d2c';

console.log(`🔍 EC2インスタンス ${instanceId} の情報を確認中...\n`);
checkEC2Instance(instanceId);
