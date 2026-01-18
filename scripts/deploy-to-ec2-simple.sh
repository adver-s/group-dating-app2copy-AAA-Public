#!/bin/bash

# EC2へ最新コードをデプロイするスクリプト

set -e

EC2_HOST="3.112.194.184"
EC2_USER="ec2-user"
SSH_KEY="$HOME/Downloads/group-matching-key.pem"
APP_NAME="group-dating-app"

echo "🚀 EC2へのデプロイを開始します..."
echo "📍 EC2 IP: $EC2_HOST"

# 1. 除外ファイルリストを作成
echo "📝 除外ファイルを設定中..."
cat > /tmp/rsync-exclude.txt << 'EOF'
node_modules/
.next/
.git/
*.log
uploads/
.env
.env.*
*.tsbuildinfo
dist/
build/
test-results/
.DS_Store
*.backup
*.backup2
*.broken
EOF

# 2. コードをEC2に転送
echo "📤 コードをEC2に転送中..."
rsync -avz --delete \
  --exclude-from=/tmp/rsync-exclude.txt \
  -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  /Users/amanokaisei/Desktop/group-dating-app2copy-AAA/ \
  ${EC2_USER}@${EC2_HOST}:~/app/

echo "✅ コード転送完了"

# 3. EC2上でDockerイメージをビルドして起動
echo "🔨 EC2上でDockerイメージをビルド中..."
ssh -i $SSH_KEY ${EC2_USER}@${EC2_HOST} << 'ENDSSH'
set -e

cd ~/app

echo "[EC2] Building Docker image..."
sudo docker build -f infra/Dockerfile -t group-dating-app:latest .

echo "[EC2] Stopping/removing old container if exists..."
sudo docker stop group-dating-app 2>/dev/null || true
sudo docker rm group-dating-app 2>/dev/null || true

echo "[EC2] Running container..."
sudo docker run -d \
  --name group-dating-app \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file ~/.env \
  group-dating-app:latest

echo "[EC2] Container status:"
sudo docker ps | grep group-dating-app

echo "[EC2] Checking logs..."
sleep 3
sudo docker logs --tail 30 group-dating-app

ENDSSH

echo ""
echo "🎉 デプロイ完了！"
echo "🔗 アプリケーションURL: http://${EC2_HOST}:3000"
echo ""
echo "📝 ログ確認: ssh -i $SSH_KEY ${EC2_USER}@${EC2_HOST} 'sudo docker logs -f group-dating-app'"

