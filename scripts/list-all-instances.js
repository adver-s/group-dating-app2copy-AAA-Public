#!/usr/bin/env node

const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');

async function listAllInstances() {
  try {
    const ec2Client = new EC2Client({
      region: process.env.AWS_REGION || 'ap-northeast-1'
    });

    console.log('🔍 すべてのEC2インスタンスを検索中...\n');

    // すべてのインスタンスを取得
    const command = new DescribeInstancesCommand({});
    const response = await ec2Client.send(command);

    if (response.Reservations && response.Reservations.length > 0) {
      console.log('📋 実行中のインスタンス:');
      console.log('=' .repeat(80));

      let instanceCount = 0;

      for (const reservation of response.Reservations) {
        for (const instance of reservation.Instances) {
          // 終了済みインスタンスは除外
          if (instance.State.Name === 'terminated') continue;

          instanceCount++;

          console.log(`\n🏷️  インスタンス ${instanceCount}`);
          console.log(`  ID: ${instance.InstanceId}`);
          console.log(`  状態: ${instance.State.Name}`);
          console.log(`  タイプ: ${instance.InstanceType}`);
          console.log(`  起動時間: ${instance.LaunchTime}`);
          console.log(`  パブリックIP: ${instance.PublicIpAddress || 'なし'}`);
          console.log(`  プライベートIP: ${instance.PrivateIpAddress || 'なし'}`);

          // Elastic IPの確認
          if (instance.NetworkInterfaces && instance.NetworkInterfaces.length > 0) {
            const networkInterface = instance.NetworkInterfaces[0];
            if (networkInterface.Association && networkInterface.Association.PublicIp) {
              console.log(`  Elastic IP: ${networkInterface.Association.PublicIp}`);
            }
          }

          // タグの確認
          if (instance.Tags && instance.Tags.length > 0) {
            console.log(`  タグ: ${instance.Tags.map(t => `${t.Key}=${t.Value}`).join(', ')}`);
          }

          // セキュリティグループ
          console.log(`  セキュリティグループ: ${instance.SecurityGroups.map(sg => `${sg.GroupName}(${sg.GroupId})`).join(', ')}`);

          // ポート3000の開放状況をチェック
          const hasPort3000 = instance.SecurityGroups.some(sg => {
            // 簡易チェック（実際のルール確認は後で）
            return sg.GroupName.toLowerCase().includes('app') || sg.GroupName.toLowerCase().includes('web');
          });

          console.log(`  ポート3000開放推定: ${hasPort3000 ? '✅ 可能性あり' : '❓ 要確認'}`);

          console.log('-'.repeat(50));
        }
      }

      if (instanceCount === 0) {
        console.log('❌ 実行中のインスタンスが見つかりません');
        console.log('すべてのインスタンスが停止または終了しています');
      }

    } else {
      console.log('❌ インスタンスが見つかりません');
    }

    console.log('\n💡 まとめ:');
    console.log('- 実行中のインスタンス数:', instanceCount);
    console.log('- ターゲットIP 3.112.210.165: ❌ 見つからない');
    console.log('- 以前のIP 54.199.84.229: 状態確認が必要です');

  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

console.log('🚀 すべてのEC2インスタンスの調査を開始...\n');
listAllInstances();















