#!/usr/bin/env node

const https = require('https');
const { EC2Client, AuthorizeSecurityGroupIngressCommand } = require('@aws-sdk/client-ec2');

function fetchPublicIp() {
  return new Promise((resolve, reject) => {
    https
      .get('https://checkip.amazonaws.com', (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data.trim()));
      })
      .on('error', reject);
  });
}

async function main() {
  try {
    const ip = await fetchPublicIp();
    if (!ip) {
      console.error('❌ パブリックIPの取得に失敗しました');
      process.exit(1);
    }

    const ec2 = new EC2Client({ region: process.env.AWS_REGION || 'ap-northeast-1' });
    const cidr = `${ip}/32`;

    const cmd = new AuthorizeSecurityGroupIngressCommand({
      GroupId: 'sg-06c935457724d7d66',
      IpPermissions: [
        {
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          IpRanges: [{ CidrIp: cidr, Description: 'Temporary SSH (assistant)' }]
        }
      ]
    });

    try {
      await ec2.send(cmd);
      console.log(`✅ 22番ポートを ${cidr} に開放しました`);
    } catch (e) {
      console.log(`ℹ️ ${e.name}: ${e.message}`);
    }
  } catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

main();


