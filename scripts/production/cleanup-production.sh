#!/bin/bash

# 本番環境用のクリーンアップスクリプト
# デバッグ・テストファイルを削除して本番環境を準備

echo "🧹 本番環境用のクリーンアップを開始します..."

# プレイグラウンドディレクトリの削除
echo "🎮 プレイグラウンドディレクトリを削除中..."
rm -rf tools/playground/

# デバッグディレクトリの削除（念のため）
echo "📁 デバッグディレクトリを削除中..."
rm -rf app/debug/
rm -rf app/api/debug/

# テストページの削除（念のため）
echo "🧪 テストページを削除中..."
rm -rf app/test-*/
rm -rf app/test/
rm -rf __tests__/
rm -rf tests/

# 開発用スクリプトの削除
echo "📜 開発用スクリプトを削除中..."
rm -f scripts/create_test_users.ts
rm -f scripts/create-ecs-roles.js
rm -f scripts/create_missing_user.js
rm -f check_team_photos.js

# ログファイルの削除
echo "📝 ログファイルを削除中..."
rm -rf logs/
rm -f *.log

# アップロードファイルの削除（開発用）
echo "📤 開発用アップロードファイルを削除中..."
rm -rf uploads/

# 動画ファイルの削除
echo "🎥 動画ファイルを削除中..."
rm -f *.mp4
rm -f *.mov
rm -f *.avi

# AWS接続メモの削除
echo "🔐 AWS接続メモを削除中..."
rm -rf aws接続メモ/

# キャッシュファイルの削除
echo "🗑️ キャッシュファイルを削除中..."
rm -rf .next/
rm -rf node_modules/.cache/
rm -rf .swc/

# 開発用の環境変数ファイルの削除
echo "⚙️ 開発用環境変数ファイルを削除中..."
rm -f .env.local
rm -f .env.development

# テスト用の設定ファイルの削除
echo "⚙️ テスト用設定ファイルを削除中..."
rm -f jest.config.js
rm -f playwright.config.ts

echo "✅ クリーンアップが完了しました！"
echo "📦 本番環境の準備が整いました。"
echo ""
echo "次のステップ:"
echo "1. 環境変数を設定してください (.env.production)"
echo "2. データベースマイグレーションを実行してください"
echo "3. アプリケーションをビルドしてください"
echo "4. 本番サーバーを起動してください"
