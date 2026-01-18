# 🚀 AWS Production Deployment Guide

## 概要
このガイドでは、ローカルMySQLからAWS Aurora MySQL Serverless v2への完全移行を行います。

## 🎯 移行のメリット

### 開発効率の向上
- ✅ セットアップ時間：数分 vs 数時間
- ✅ メンテナンス不要
- ✅ 自動バックアップ
- ✅ 自動スケーリング

### 安定性
- ✅ 99.99%の可用性
- ✅ 自動フェイルオーバー
- ✅ マルチAZ配置

### セキュリティ
- ✅ 暗号化（保存時・転送時）
- ✅ IAM統合
- ✅ VPC内配置

## 📋 前提条件

1. **AWS CLI設定**
   ```bash
   aws configure
   ```

2. **Terraformインストール**
   ```bash
   brew install terraform
   ```

3. **環境変数設定**
   ```bash
   export DB_PASSWORD="your-secure-password"
   export AWS_ACCESS_KEY_ID="your-access-key"
   export AWS_SECRET_ACCESS_KEY="your-secret-key"
   ```

## 🚀 クイックデプロイ

### 1. ワンクリックデプロイ
```bash
npm run deploy:aws
```

### 2. 手動デプロイ（段階的）

#### Step 1: Terraform初期化
```bash
npm run terraform:init
```

#### Step 2: インフラプラン確認
```bash
npm run terraform:plan
```

#### Step 3: インフラデプロイ
```bash
npm run terraform:apply
```

#### Step 4: 環境変数更新
```bash
cp env.production.example .env.production
# Auroraエンドポイントを手動で更新
```

#### Step 5: データベースマイグレーション
```bash
npx prisma migrate deploy
```

#### Step 6: アプリケーション起動
```bash
npm run build
npm start
```

## 🔧 作成されるAWSリソース

### データベース
- **Aurora MySQL Serverless v2**
  - 従量課金（0.5-16 ACU）
  - 自動スケーリング
  - マルチAZ配置

### ネットワーク
- **VPC**: 10.0.0.0/16
- **Public Subnets**: 10.0.1.0/24, 10.0.2.0/24
- **Private Subnets**: 10.0.3.0/24, 10.0.4.0/24
- **Security Groups**: Aurora用、EC2用

### セキュリティ
- **IAM Roles**: 最小権限原則
- **Secrets Manager**: データベース認証情報
- **VPC内配置**: プライベートサブネット

## 📊 コスト最適化

### Aurora Serverless v2
- **最小容量**: 0.5 ACU（約$15/月）
- **最大容量**: 16 ACU（約$480/月）
- **実際の使用量に応じて課金**

### 推奨設定
- **開発環境**: 0.5-2 ACU
- **本番環境**: 2-8 ACU

## 🔍 トラブルシューティング

### よくある問題

#### 1. データベース接続エラー
```bash
# 接続テスト
curl http://localhost:3000/api/debug/check-db
```

#### 2. Terraformエラー
```bash
# 状態リセット
cd infra/terraform
terraform destroy
terraform init
terraform apply
```

#### 3. マイグレーションエラー
```bash
# スキーマリセット
npx prisma migrate reset
npx prisma migrate deploy
```

## 📈 監視とログ

### CloudWatch
- **メトリクス**: CPU、メモリ、接続数
- **ログ**: アプリケーションログ
- **アラーム**: 異常検知

### 設定例
```bash
# CloudWatchログ確認
aws logs describe-log-groups
aws logs tail /aws/rds/instance/dating-app-aurora
```

## 🔄 開発ワークフロー

### ローカル開発
```bash
# ローカルで開発（Aurora接続）
npm run dev
```

### 本番デプロイ
```bash
# 本番環境にデプロイ
npm run deploy:aws
```

### ロールバック
```bash
# 前のバージョンに戻す
git checkout HEAD~1
npm run deploy:aws
```

## 🛡️ セキュリティチェックリスト

- [ ] VPC内配置
- [ ] セキュリティグループ設定
- [ ] IAM最小権限
- [ ] 暗号化有効
- [ ] バックアップ設定
- [ ] 監査ログ有効

## 📞 サポート

問題が発生した場合：
1. ログを確認
2. CloudWatchメトリクスを確認
3. Terraform状態を確認
4. 必要に応じてリソースを再作成

## 🎉 完了

AWS環境への移行が完了すると：
- 開発効率が大幅に向上
- バグの原因となるローカルDB問題を解決
- 本番環境との差異を最小化
- スケーラブルなインフラを獲得

**Happy Coding! 🚀**
