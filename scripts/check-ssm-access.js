#!/usr/bin/env node

const { SSMClient, DescribeInstanceInformationCommand, SendCommandCommand } = require('@aws-sdk/client-ssm');

async function checkSSMAccess() {
  try {
    const ssmClient = new SSMClient({
      region: process.env.AWS_REGION || 'ap-northeast-1'
    });

    console.log('🔍 AWS Systems Manager (SSM) でのアクセス可能性を確認中...\n');

    // インスタンスのSSM情報を取得
    const describeCommand = new DescribeInstanceInformationCommand({
      Filters: [
        {
          Key: 'InstanceIds',
          Values: ['i-0b57e0907ae360d2c']
        }
      ]
    });

    const response = await ssmClient.send(describeCommand);

    if (response.InstanceInformationList && response.InstanceInformationList.length > 0) {
      const instanceInfo = response.InstanceInformationList[0];

      console.log('✅ SSMアクセス可能！');
      console.log(`📋 インスタンス情報:`);
      console.log(`  ID: ${instanceInfo.InstanceId}`);
      console.log(`  Ping状態: ${instanceInfo.PingStatus}`);
      console.log(`  最終Ping: ${instanceInfo.LastPingDateTime}`);
      console.log(`  プラットフォーム: ${instanceInfo.PlatformName} ${instanceInfo.PlatformVersion}`);

      // Dockerコンテナの状態を確認するコマンドを送信
      console.log('\n🐳 Dockerコンテナの状態を確認中...');

      const sendCommand = new SendCommandCommand({
        InstanceIds: ['i-0b57e0907ae360d2c'],
        DocumentName: 'AWS-RunShellScript',
        Parameters: {
          commands: [
            'echo "=== システム情報 ==="',
            'uname -a',
            'whoami',
            'echo "=== Docker状態 ==="',
            'docker --version',
            'docker ps -a',
            'echo "=== ポート3000の確認 ==="',
            'netstat -tlnp | grep :3000 || echo "ポート3000は使用されていません"',
            'echo "=== ログの確認 ==="',
            'ls -la /var/log/ 2>/dev/null || echo "ログディレクトリなし"',
            'echo "=== プロセス確認 ==="',
            'ps aux | grep -E "(node|npm|docker|group-dating)" | grep -v grep',
            'echo "=== 完了 ==="'
          ]
        }
      });

      const commandResponse = await ssmClient.send(sendCommand);

      console.log(`\n📤 コマンド実行ID: ${commandResponse.Command.CommandId}`);
      console.log('⏳ コマンド実行中... 数分かかる場合があります');

      // コマンドの結果を取得（簡易版）
      console.log('\n💡 SSMコマンドが送信されました。AWSマネジメントコンソールで結果を確認してください。');
      console.log('   または、数分待ってから以下のコマンドで結果を確認:');
      console.log(`   aws ssm get-command-invocation --command-id ${commandResponse.Command.CommandId} --instance-id i-0b57e0907ae360d2c --region ap-northeast-1`);

    } else {
      console.log('❌ SSMアクセス不可');
      console.log('インスタンスがSSMエージェントをインストールしていないか、SSMアクセスが有効化されていません');

      console.log('\n🔧 解決策:');
      console.log('1. AWSマネジメントコンソールからインスタンスを再起動');
      console.log('2. デプロイスクリプトをローカルで実行（SSHが必要）');
      console.log('3. 手動でアプリケーションを起動');

      console.log('\n📋 手動での対応手順:');
      console.log('1. AWSマネジメントコンソールにログイン');
      console.log('2. EC2インスタンス i-0b57e0907ae360d2c を選択');
      console.log('3. インスタンスを再起動');
      console.log('4. または、SSMを使ってコマンド実行');
    }

  } catch (error) {
    console.error('❌ エラー:', error.message);

    if (error.name === 'UnauthorizedOperation') {
      console.log('\n💡 AWS認証情報に問題がある可能性があります');
    }
  }
}

console.log('🚀 SSMアクセス確認を開始...\n');
checkSSMAccess();
