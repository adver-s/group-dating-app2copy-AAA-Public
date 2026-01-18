#!/bin/bash

# EC2インスタンスのアプリケーション状態を確認するスクリプト
# このスクリプトはEC2インスタンス内で実行してください

echo "🔍 アプリケーションの状態を確認中..."
echo ""

# Dockerの状態
echo "📦 Docker情報:"
docker --version
echo ""

# 実行中のコンテナ
echo "🐳 実行中のコンテナ:"
docker ps
echo ""

# すべてのコンテナ（停止中も含む）
echo "📋 すべてのコンテナ:"
docker ps -a
echo ""

# Dockerイメージ
echo "💿 利用可能なイメージ:"
docker images | head -10
echo ""

# ポート3000の使用状況
echo "🔌 ポート3000の使用状況:"
sudo netstat -tlnp | grep :3000 || lsof -i :3000 || echo "ポート3000は使用されていません"
echo ""

# プロセス確認
echo "⚙️  Node.jsプロセス:"
ps aux | grep node | grep -v grep || echo "Node.jsプロセスが見つかりません"
echo ""

# 環境変数ファイルの確認
echo "📄 環境変数ファイル:"
[ -f .env ] && echo "✅ .env ファイルが存在します（カレントディレクトリ）" || echo "❌ .env ファイルがありません（カレントディレクトリ）"
[ -f ~/.env ] && echo "✅ .env ファイルが存在します（ホームディレクトリ）" || echo "❌ .env ファイルがありません（ホームディレクトリ）"
echo ""

# ディスク容量
echo "💾 ディスク容量:"
df -h | grep -E '(Filesystem|/$)' 
echo ""

# メモリ使用量
echo "🧠 メモリ使用量:"
free -h
echo ""

# ログファイル（group-dating-appコンテナがある場合）
if docker ps -a | grep -q group-dating-app; then
  echo "📝 アプリケーションログ（最新30行）:"
  docker logs --tail 30 group-dating-app
else
  echo "⚠️  group-dating-appコンテナが見つかりません"
fi

echo ""
echo "🌐 パブリックIP:"
curl -s ifconfig.me
echo ""

