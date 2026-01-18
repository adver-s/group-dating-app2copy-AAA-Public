#!/usr/bin/env node

const { EC2Client, DescribeInstancesCommand, DescribeSecurityGroupsCommand } = require('@aws-sdk/client-ec2');

async function checkSecurityGroups() {
  try {
    const ec2Client = new EC2Client({
      region: process.env.AWS_REGION || 'ap-northeast-1'
    });

    console.log('🔍 EC2インスタンスのセキュリティグループを確認中...\n');

    // インスタンスの詳細を取得
    const instanceCommand = new DescribeInstancesCommand({
      InstanceIds: ['i-0b57e0907ae360d2c']
    });

    const instanceResponse = await ec2Client.send(instanceCommand);

    if (instanceResponse.Reservations && instanceResponse.Reservations.length > 0) {
      const instance = instanceResponse.Reservations[0].Instances[0];

      console.log(`📋 インスタンス情報:`);
      console.log(`ID: ${instance.InstanceId}`);
      console.log(`状態: ${instance.State.Name}`);
      console.log(`セキュリティグループ: ${instance.SecurityGroups.map(sg => sg.GroupId).join(', ')}`);

      // セキュリティグループの詳細を取得
      const securityGroupIds = instance.SecurityGroups.map(sg => sg.GroupId);

      for (const sgId of securityGroupIds) {
        console.log(`\n🔒 セキュリティグループ ${sgId} の詳細:`);

        const sgCommand = new DescribeSecurityGroupsCommand({
          GroupIds: [sgId]
        });

        const sgResponse = await ec2Client.send(sgCommand);
        const securityGroup = sgResponse.SecurityGroups[0];

        console.log(`グループ名: ${securityGroup.GroupName}`);
        console.log(`説明: ${securityGroup.Description}`);

        console.log(`\nインバウンドルール:`);
        securityGroup.IpPermissions.forEach((rule, index) => {
          console.log(`  ${index + 1}. ポート: ${rule.FromPort}-${rule.ToPort} (${rule.IpProtocol})`);
          console.log(`     ソース: ${rule.IpRanges.map(range => range.CidrIp).join(', ')}`);
        });

        // SSHポート22が開いているか確認
        const hasSSH = securityGroup.IpPermissions.some(rule =>
          rule.FromPort === 22 && rule.ToPort === 22
        );

        // ポート3000が開いているか確認
        const hasPort3000 = securityGroup.IpPermissions.some(rule =>
          rule.FromPort === 3000 && rule.ToPort === 3000
        );

        console.log(`\n🚪 ポート状態:`);
        console.log(`  SSH (22): ${hasSSH ? '✅ 開放' : '❌ ブロック'}`);
        console.log(`  App (3000): ${hasPort3000 ? '✅ 開放' : '❌ ブロック'}`);

        if (!hasSSH) {
          console.log(`\n⚠️  SSHポートがブロックされているため、直接SSH接続できません`);
        }

        if (!hasPort3000) {
          console.log(`\n⚠️  ポート3000がブロックされているため、アプリケーションにアクセスできません`);
        }
      }

    } else {
      console.log(`❌ インスタンスが見つかりません`);
    }

  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

checkSecurityGroups();
