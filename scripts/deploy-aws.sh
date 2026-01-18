#!/bin/bash

set -e

echo "🚀 AWS Production Deployment Started"

# 1. Terraformでインフラをデプロイ
echo "📦 Deploying infrastructure with Terraform..."
cd infra/terraform

# Terraform初期化
terraform init

# Terraformプラン
terraform plan -var="db_password=$DB_PASSWORD" -out=tfplan

# Terraform適用
terraform apply tfplan

# 出力値を取得
AURORA_ENDPOINT=$(terraform output -raw aurora_cluster_endpoint)
VPC_ID=$(terraform output -raw vpc_id)

echo "✅ Infrastructure deployed successfully"
echo "🔗 Aurora Endpoint: $AURORA_ENDPOINT"
echo "🌐 VPC ID: $VPC_ID"

cd ../..

# 2. 環境変数を更新
echo "⚙️ Updating environment variables..."
cp env.production.example .env.production

# Auroraエンドポイントを環境変数に設定
sed -i '' "s/your-aurora-cluster-endpoint/$AURORA_ENDPOINT/g" .env.production
sed -i '' "s/your-secure-password/$DB_PASSWORD/g" .env.production

# 3. データベースマイグレーション
echo "🗄️ Running database migrations..."
export $(cat .env.production | xargs)
npx prisma migrate deploy

# 4. アプリケーションをビルド
echo "🔨 Building application..."
npm run build

# 5. 本番環境で起動
echo "🚀 Starting production server..."
npm start

echo "✅ AWS Production Deployment Completed!"
echo "🌐 Application is running at: http://localhost:3000"
