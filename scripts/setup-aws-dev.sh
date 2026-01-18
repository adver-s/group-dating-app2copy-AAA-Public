#!/bin/bash

set -e

echo "🚀 AWS Development Environment Setup"

# 1. 環境変数ファイルを作成
echo "📝 Creating environment file..."
if [ ! -f .env ]; then
  cp env.example .env
  echo "✅ Created .env file from template"
else
  echo "⚠️ .env file already exists"
fi

# 2. AWS認証情報の確認
echo "🔐 Checking AWS credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
  echo "❌ AWS credentials not configured"
  echo "Please run: aws configure"
  exit 1
fi

echo "✅ AWS credentials configured"

# 3. Terraformでインフラをデプロイ
echo "📦 Deploying AWS infrastructure..."
cd infra/terraform

# Terraform初期化
if [ ! -d .terraform ]; then
  terraform init
fi

# データベースパスワードの確認
if [ -z "$DB_PASSWORD" ]; then
  echo "❌ DB_PASSWORD environment variable not set"
  echo "Please set: export DB_PASSWORD='your-secure-password'"
  exit 1
fi

# Terraformプラン
terraform plan -var="db_password=$DB_PASSWORD" -out=tfplan

# Terraform適用
terraform apply tfplan

# 出力値を取得
AURORA_ENDPOINT=$(terraform output -raw aurora_cluster_endpoint)
echo "✅ Aurora endpoint: $AURORA_ENDPOINT"

cd ../..

# 4. 環境変数を更新
echo "⚙️ Updating environment variables..."
sed -i '' "s/your-aurora-cluster-endpoint/$AURORA_ENDPOINT/g" .env
sed -i '' "s/your-secure-password/$DB_PASSWORD/g" .env

# 5. データベースマイグレーション
echo "🗄️ Running database migrations..."
export $(cat .env | xargs)
npx prisma migrate deploy

# 6. サンプルデータの投入
echo "📊 Seeding sample data..."
node infra/scripts/addSampleData.js

echo "✅ AWS Development Environment Setup Completed!"
echo "🌐 You can now run: npm run dev"
