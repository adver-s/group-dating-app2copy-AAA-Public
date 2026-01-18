#!/usr/bin/env node

const { EC2Client, AuthorizeSecurityGroupIngressCommand, DescribeSecurityGroupsCommand } = require('@aws-sdk/client-ec2');

async function addPort3000() {
  try {
    const ec2Client = new EC2Client({
      region: process.env.AWS_REGION || 'ap-northeast-1'
    });

    console.log('🔍 セキュリティグループの現在の設定を確認中...\n');

    // 現在のセキュリティグループ設定を取得
    const sgCommand = new DescribeSecurityGroupsCommand({
      GroupIds: ['sg-06c935457724d7d66']
    });

    const sgResponse = await ec2Client.send(sgCommand);
    const securityGroup = sgResponse.SecurityGroups[0];

    // ポート3000が既に開いているか確認
    const hasPort3000 = securityGroup.IpPermissions.some(rule =>
      rule.FromPort === 3000 && rule.ToPort === 3000
    );

    if (hasPort3000) {
      console.log('✅ ポート3000は既に開放されています');
      return;
    }

    console.log('❌ ポート3000が開放されていません。追加します...\n');

    // ポート3000を追加
    const addPortCommand = new AuthorizeSecurityGroupIngressCommand({
      GroupId: 'sg-06c935457724d7d66',
      IpPermissions: [
        {
          IpProtocol: 'tcp',
          FromPort: 3000,
          ToPort: 3000,
          IpRanges: [
            {
              CidrIp: '0.0.0.0/0',
              Description: 'Allow HTTP access for dating app'
            }
          ]
        }
      ]
    });

    await ec2Client.send(addPortCommand);
    console.log('✅ ポート3000をセキュリティグループに追加しました！');

    // 変更後の設定を確認
    console.log('\n🔍 変更後のセキュリティグループ設定:');
    const updatedSgResponse = await ec2Client.send(sgCommand);
    const updatedSecurityGroup = updatedSgResponse.SecurityGroups[0];

    console.log('インバウンドルール:');
    updatedSecurityGroup.IpPermissions.forEach((rule, index) => {
      console.log(`  ${index + 1}. ポート: ${rule.FromPort}-${rule.ToPort} (${rule.IpProtocol})`);
      console.log(`     ソース: ${rule.IpRanges.map(range => range.CidrIp).join(', ')}`);
    });

    console.log('\n🎉 これでポート3000が開放されました！');
    console.log('🌐 アプリケーションにアクセス可能になったはずです: http://54.199.84.229:3000');

  } catch (error) {
    console.error('❌ エラー:', error.message);

    if (error.name === 'UnauthorizedOperation') {
      console.log('\n💡 AWS認証情報に問題がある可能性があります:');
      console.log('1. AWS_ACCESS_KEY_ID と AWS_SECRET_ACCESS_KEY を確認');
      console.log('2. IAMユーザーにEC2の権限があるか確認');
      console.log('3. aws configure または環境変数で認証情報を設定');
    }
  }
}

console.log('🚀 セキュリティグループにポート3000を追加中...\n');
addPort3000();
