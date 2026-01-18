#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function troubleshootEC2() {
  const EC2_HOST = '54.199.84.229';
  const EC2_USER = 'ubuntu';
  const SSH_KEY = process.env.EC2_KEY || '/Users/amanokaisei/Desktop/group-dating-app2copy-AAAのコピー3/group-matching-key.pem';

  console.log(`🔧 EC2インスタンス ${EC2_HOST} のトラブルシューティングを開始...\n`);

  try {
    // 1. SSH接続テスト
    console.log('📡 1. SSH接続テスト...');
    try {
      const { stdout: sshTest } = await execPromise(`ssh -i ${SSH_KEY} -o ConnectTimeout=5 -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} "echo 'SSH接続成功'"`);
      console.log('✅ SSH接続: 成功');
    } catch (error) {
      console.log('❌ SSH接続: 失敗');
      console.log('エラー:', error.message);
      return;
    }

    // 2. インスタンス情報の確認
    console.log('\n📋 2. インスタンス情報確認...');
    const { stdout: instanceInfo } = await execPromise(`ssh -i ${SSH_KEY} ${EC2_USER}@${EC2_HOST} "uname -a && uptime && whoami && pwd"`);
    console.log('インスタンス情報:', instanceInfo);

    // 3. Dockerコンテナの確認
    console.log('\n🐳 3. Dockerコンテナ確認...');
    const { stdout: dockerInfo } = await execPromise(`ssh -i ${SSH_KEY} ${EC2_USER}@${EC2_HOST} "docker ps -a"`);
    console.log('Dockerコンテナ:', dockerInfo);

    // 4. ポート3000の確認
    console.log('\n🚪 4. ポート3000確認...');
    const { stdout: port3000 } = await execPromise(`ssh -i ${SSH_KEY} ${EC2_USER}@${EC2_HOST} "netstat -tlnp | grep :3000 || echo 'ポート3000は使用されていません'"`);
    console.log('ポート3000状態:', port3000);

    // 5. プロセス確認
    console.log('\n⚙️  5. プロセス確認...');
    const { stdout: processes } = await execPromise(`ssh -i ${SSH_KEY} ${EC2_USER}@${EC2_HOST} "ps aux | grep -E '(node|npm|docker|group-dating)' | grep -v grep"`);
    console.log('関連プロセス:', processes);

    // 6. ログ確認
    console.log('\n📝 6. ログ確認...');
    const { stdout: logs } = await execPromise(`ssh -i ${SSH_KEY} ${EC2_USER}@${EC2_HOST} "ls -la logs/ 2>/dev/null || echo 'logsディレクトリなし'"`);
    console.log('ログディレクトリ:', logs);

    // 7. ファイアウォール確認
    console.log('\n🔥 7. ファイアウォール確認...');
    const { stdout: firewall } = await execPromise(`ssh -i ${SSH_KEY} ${EC2_USER}@${EC2_HOST} "sudo ufw status 2>/dev/null || echo 'UFWなし'"`);
    console.log('ファイアウォール:', firewall);

    // 8. .envファイル確認
    console.log('\n📄 8. 環境設定確認...');
    const { stdout: envFile } = await execPromise(`ssh -i ${SSH_KEY} ${EC2_USER}@${EC2_HOST} "ls -la .env 2>/dev/null || echo '.envファイルなし'"`);
    console.log('.envファイル:', envFile);

    // 9. ネットワーク確認
    console.log('\n🌐 9. ネットワーク確認...');
    const { stdout: network } = await execPromise(`ssh -i ${SSH_KEY} ${EC2_USER}@${EC2_HOST} "curl -s http://localhost:3000 2>/dev/null || echo 'localhost:3000にアクセス不可'"`);
    console.log('localhost:3000アクセス:', network.substring(0, 100));

    // 10. 提案された解決策
    console.log('\n💡 提案された解決策:');
    console.log('1. アプリケーションの起動: docker start group-dating-app');
    console.log('2. または再デプロイ: ./scripts/deploy-ec2.sh');
    console.log('3. ログ確認: docker logs group-dating-app');

  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

troubleshootEC2();
