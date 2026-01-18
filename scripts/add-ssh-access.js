#!/usr/bin/env node

const { EC2Client, AuthorizeSecurityGroupIngressCommand, RevokeSecurityGroupIngressCommand } = require('@aws-sdk/client-ec2');

async function addSSHAccess() {
  try {
    const ec2Client = new EC2Client({
      region: process.env.AWS_REGION || 'ap-northeast-1'
    });

    console.log('🔍 現在のSSHアクセス設定を確認中...\n');

    // 現在の自分のIPアドレスを取得（これはスクリプト実行環境のIP）
    const currentIP = process.env.CURRENT_IP || '103.5.140.146'; // 実際のIPアドレスを指定

    console.log(`📍 現在のIPアドレス: ${currentIP}`);

    // 現在のセキュリティグループ設定を取得
    const describeCommand = require('@aws-sdk/client-ec2').DescribeSecurityGroupsCommand;
    const describeResponse = await ec2Client.send(new describeCommand({
      GroupIds: ['sg-06c935457724d7d66']
    }));

    const securityGroup = describeResponse.SecurityGroups[0];

    // 現在のSSHルールを確認
    const sshRule = securityGroup.IpPermissions.find(rule =>
      rule.FromPort === 22 && rule.ToPort === 22
    );

    console.log('現在のSSHルール:');
    sshRule.IpRanges.forEach((range, index) => {
      console.log(`  ${index + 1}. ${range.CidrIp}`);
    });

    // 現在のIPが既に許可されているか確認
    const isAlreadyAllowed = sshRule.IpRanges.some(range =>
      range.CidrIp === `${currentIP}/32`
    );

    if (isAlreadyAllowed) {
      console.log('✅ 現在のIPアドレスは既にSSHアクセスが許可されています');
      return;
    }

    console.log(`❌ 現在のIPアドレス (${currentIP}) はSSHアクセスが許可されていません`);
    console.log('🔧 SSHアクセスを追加します...\n');

    // SSHアクセスを追加
    const addCommand = new AuthorizeSecurityGroupIngressCommand({
      GroupId: 'sg-06c935457724d7d66',
      IpPermissions: [
        {
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          IpRanges: [
            {
              CidrIp: `${currentIP}/32`,
              Description: 'Temporary SSH access for troubleshooting'
            }
          ]
        }
      ]
    });

    await ec2Client.send(addCommand);
    console.log(`✅ IPアドレス ${currentIP} のSSHアクセスを追加しました！`);

    // 追加後の設定を確認
    console.log('\n🔍 追加後のSSHルール:');
    const updatedResponse = await ec2Client.send(new describeCommand({
      GroupIds: ['sg-06c935457724d7d66']
    }));

    const updatedSshRule = updatedResponse.SecurityGroups[0].IpPermissions.find(rule =>
      rule.FromPort === 22 && rule.ToPort === 22
    );

    updatedSshRule.IpRanges.forEach((range, index) => {
      console.log(`  ${index + 1}. ${range.CidrIp}`);
    });

    console.log('\n🎉 SSH接続が可能になりました！');
    console.log('SSHコマンド: ssh -i /path/to/your-key.pem ubuntu@54.199.84.229');

    console.log('\n⚠️  重要: 作業終了後はセキュリティのため、このIPアドレスを削除してください');
    console.log('削除コマンド: node scripts/remove-ssh-access.js');

  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

console.log('🚀 SSHアクセスを追加中...\n');
addSSHAccess();
