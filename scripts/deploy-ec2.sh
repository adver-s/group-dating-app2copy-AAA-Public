#!/bin/bash

# EC2サーバーへのデプロイスクリプト
# 使用方法: ./scripts/deploy-ec2.sh

set -e

# 設定
EC2_HOST=${EC2_HOST:-"your-ec2-public-ip"}
EC2_USER=${EC2_USER:-"ubuntu"}
EC2_KEY=${EC2_KEY:-"~/.ssh/your-key.pem"}
APP_NAME="group-dating-app"
DOCKER_IMAGE="group-dating-app:latest"

echo "🚀 EC2サーバーへのデプロイを開始します..."

# 1. ローカルでDockerイメージをビルド
echo "📦 Dockerイメージをビルド中..."
docker build -t $DOCKER_IMAGE .

# 2. イメージをtarファイルに保存
echo "💾 Dockerイメージをtarファイルに保存中..."
docker save $DOCKER_IMAGE | gzip > ${APP_NAME}.tar.gz

# 3. EC2サーバーにファイルを転送
echo "📤 EC2サーバーにファイルを転送中..."
scp -i $EC2_KEY ${APP_NAME}.tar.gz $EC2_USER@$EC2_HOST:~/

# 4. EC2サーバーでデプロイを実行
echo "🔧 EC2サーバーでデプロイを実行中..."
ssh -i $EC2_KEY $EC2_USER@$EC2_HOST << 'EOF'
  # 既存のコンテナを停止・削除
  docker stop group-dating-app || true
  docker rm group-dating-app || true
  
  # 古いイメージを削除
  docker rmi group-dating-app:latest || true
  
  # 新しいイメージを読み込み
  docker load < group-dating-app.tar.gz
  
  # 環境変数ファイルを確認
  if [ ! -f .env ]; then
    echo "❌ .envファイルが見つかりません。EC2サーバーに.envファイルを配置してください。"
    exit 1
  fi
  
  # 新しいコンテナを起動
  docker run -d \
    --name group-dating-app \
    --restart unless-stopped \
    -p 3000:3000 \
    --env-file .env \
    group-dating-app:latest
  
  # 古いtarファイルを削除
  rm group-dating-app.tar.gz
  
  echo "✅ デプロイが完了しました！"
  echo "🌐 アプリケーションは http://$(curl -s ifconfig.me):3000 でアクセスできます"
EOF

# 5. ローカルのtarファイルを削除
rm ${APP_NAME}.tar.gz

echo "🎉 デプロイが完了しました！"
echo "📱 招待リンク例: http://$EC2_HOST:3000/invite/ABC123XY"
echo "💡 ヒント: 招待リンクは完全なURL（http://...）で生成されるので、"
echo "    検索バーにコピー&ペーストでアクセスできます！"
