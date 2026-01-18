#!/bin/bash

# EC2インスタンスでアプリケーションを再起動するスクリプト
# このスクリプトはEC2インスタンス内で実行してください

set -e

echo "🔄 アプリケーションを再起動します..."

# 既存のコンテナを確認
echo "📋 現在のDockerコンテナ:"
docker ps -a

# 既存のコンテナを停止・削除
echo "🛑 既存のコンテナを停止中..."
docker stop group-dating-app 2>/dev/null || echo "コンテナは既に停止しています"
docker rm group-dating-app 2>/dev/null || echo "コンテナは既に削除されています"

# Dockerイメージを確認
echo "📦 利用可能なDockerイメージ:"
docker images | grep group-dating-app || echo "group-dating-appイメージが見つかりません"

# 環境変数ファイルを確認
if [ ! -f ~/.env ] && [ ! -f .env ]; then
  echo "❌ .envファイルが見つかりません"
  echo "💡 ホームディレクトリまたは現在のディレクトリに.envファイルを配置してください"
  exit 1
fi

ENV_FILE=".env"
if [ -f ~/.env ]; then
  ENV_FILE=~/.env
fi

echo "✅ 環境変数ファイル: $ENV_FILE"

# 新しいコンテナを起動
echo "🚀 新しいコンテナを起動中..."
docker run -d \
  --name group-dating-app \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file $ENV_FILE \
  group-dating-app:latest

# コンテナの状態を確認
echo ""
echo "✅ コンテナが起動しました！"
echo "📋 現在の状態:"
docker ps | grep group-dating-app

# ログを表示
echo ""
echo "📝 起動ログ（最新20行）:"
sleep 3
docker logs --tail 20 group-dating-app

# アクセスURLを表示
PUBLIC_IP=$(curl -s ifconfig.me)
echo ""
echo "🎉 アプリケーションが起動しました！"
echo "🔗 アクセスURL: http://$PUBLIC_IP:3000"
echo "🔗 または: http://3.112.194.184:3000"

