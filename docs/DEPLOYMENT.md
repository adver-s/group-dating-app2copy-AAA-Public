# デプロイメントガイド

## 概要

このドキュメントでは、Gather-sアプリケーションのデプロイメント手順について説明します。

## デプロイメント環境

### 開発環境
- **場所**: ローカル開発マシン
- **URL**: `http://localhost:3000`
- **データベース**: ローカルMySQL または AWS Aurora（開発用）

### ステージング環境
- **場所**: AWS EC2
- **URL**: `http://staging-ec2-ip:3000`
- **データベース**: AWS Aurora（ステージング用）

### 本番環境
- **場所**: AWS EC2
- **URL**: `https://your-domain.com`
- **データベース**: AWS Aurora（本番用）

## 前提条件

### 必要なツール
- Node.js 18+
- npm または yarn
- Docker（オプション）
- AWS CLI
- Git

### AWS リソース
- EC2インスタンス
- Aurora MySQL クラスター
- S3バケット
- Secrets Manager
- IAM ロール・ポリシー

## 環境変数の設定

### 開発環境 (.env.local)
```bash
# データベース
DATABASE_URL="mysql://user:password@localhost:3306/dating_app_dev"

# JWT
JWT_SECRET_KEY="your-development-secret-key"
JWT_EXPIRES_IN="24h"

# AWS（開発用）
AWS_ACCESS_KEY_ID="your-dev-access-key"
AWS_SECRET_ACCESS_KEY="your-dev-secret-key"
AWS_REGION="ap-northeast-1"

# アプリケーション
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NODE_ENV="development"
```

### ステージング環境 (.env.staging)
```bash
# データベース
DATABASE_URL="mysql://admin:password@staging-aurora-endpoint:3306/dating_app_staging"

# JWT
JWT_SECRET_KEY="your-staging-secret-key"
JWT_EXPIRES_IN="24h"

# AWS
AWS_ACCESS_KEY_ID="your-staging-access-key"
AWS_SECRET_ACCESS_KEY="your-staging-secret-key"
AWS_REGION="ap-northeast-1"

# アプリケーション
NEXT_PUBLIC_APP_URL="http://staging-ec2-ip:3000"
NEXT_PUBLIC_API_URL="http://staging-ec2-ip:3000/api"
NODE_ENV="staging"
```

### 本番環境 (.env.production)
```bash
# データベース
DATABASE_URL="mysql://admin:password@production-aurora-endpoint:3306/dating_app"

# JWT
JWT_SECRET_KEY="your-production-secret-key"
JWT_EXPIRES_IN="24h"

# AWS
AWS_ACCESS_KEY_ID="your-production-access-key"
AWS_SECRET_ACCESS_KEY="your-production-secret-key"
AWS_REGION="ap-northeast-1"

# アプリケーション
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_API_URL="https://your-domain.com/api"
NODE_ENV="production"
```

## デプロイメント手順

### 1. 開発環境セットアップ

```bash
# リポジトリのクローン
git clone <repository-url>
cd group-dating-app

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.local を編集

# データベースのセットアップ
npx prisma db push

# 開発サーバーの起動
npm run dev
```

### 2. ステージング環境デプロイ

#### EC2インスタンスの準備
```bash
# EC2インスタンスにSSH接続
ssh -i ~/.ssh/your-key.pem ubuntu@staging-ec2-ip

# Node.js のインストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2のインストール（プロセス管理）
sudo npm install -g pm2

# アプリケーションのクローン
git clone <repository-url>
cd group-dating-app

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.staging
# .env.staging を編集

# データベースのセットアップ
npx prisma db push

# アプリケーションのビルド
npm run build

# PM2でアプリケーションを起動
pm2 start npm --name "gather-s-staging" -- run start:prod

# PM2の設定を保存
pm2 save
pm2 startup
```

#### Nginxの設定（オプション）
```nginx
server {
    listen 80;
    server_name staging-ec2-ip;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. 本番環境デプロイ

#### Dockerを使用したデプロイ

##### Dockerfileの作成
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
```

##### Docker Composeの設定
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: unless-stopped
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
    volumes:
      - db_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  db_data:
```

##### デプロイの実行
```bash
# Dockerイメージのビルド
docker build -t gather-s:latest .

# Docker Composeで起動
docker-compose up -d

# ログの確認
docker-compose logs -f app
```

#### 手動デプロイ

```bash
# EC2インスタンスにSSH接続
ssh -i ~/.ssh/your-key.pem ubuntu@production-ec2-ip

# アプリケーションの更新
cd group-dating-app
git pull origin main

# 依存関係の更新
npm install

# データベースマイグレーション
npx prisma db push

# アプリケーションのビルド
npm run build

# PM2でアプリケーションを再起動
pm2 restart gather-s-production
```

## データベースマイグレーション

### 開発環境
```bash
# スキーマの変更をデータベースに反映
npx prisma db push

# マイグレーションファイルの生成
npx prisma migrate dev --name migration_name
```

### 本番環境
```bash
# マイグレーションの実行
npx prisma migrate deploy

# データベースの状態確認
npx prisma migrate status
```

## 監視・ログ

### アプリケーションログ
```bash
# PM2のログ確認
pm2 logs gather-s-production

# リアルタイムログ
pm2 logs gather-s-production --lines 100 -f
```

### システムリソース監視
```bash
# CPU・メモリ使用率の確認
htop

# ディスク使用量の確認
df -h

# ネットワーク接続の確認
netstat -tulpn
```

## バックアップ

### データベースバックアップ
```bash
# 手動バックアップ
mysqldump -h aurora-endpoint -u admin -p dating_app > backup_$(date +%Y%m%d_%H%M%S).sql

# 自動バックアップ（cron）
0 2 * * * mysqldump -h aurora-endpoint -u admin -p dating_app > /backups/backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql
```

### アプリケーションファイルのバックアップ
```bash
# アプリケーションディレクトリのバックアップ
tar -czf app_backup_$(date +%Y%m%d_%H%M%S).tar.gz /path/to/app

# S3へのアップロード
aws s3 cp app_backup_*.tar.gz s3://your-backup-bucket/
```

## トラブルシューティング

### よくある問題

#### 1. アプリケーションが起動しない
```bash
# ログの確認
pm2 logs gather-s-production

# プロセスの状態確認
pm2 status

# ポートの使用状況確認
netstat -tulpn | grep :3000
```

#### 2. データベース接続エラー
```bash
# データベース接続の確認
npx prisma db push

# 環境変数の確認
cat .env.production | grep DATABASE_URL
```

#### 3. メモリ不足
```bash
# メモリ使用量の確認
free -h

# プロセスのメモリ使用量確認
ps aux --sort=-%mem | head
```

### ロールバック手順

```bash
# 前のバージョンに戻す
git checkout previous-commit-hash

# 依存関係の再インストール
npm install

# アプリケーションの再ビルド
npm run build

# PM2で再起動
pm2 restart gather-s-production
```

## セキュリティチェックリスト

- [ ] 環境変数の適切な設定
- [ ] データベースのアクセス制限
- [ ] HTTPS通信の設定
- [ ] ファイアウォールの設定
- [ ] 定期的なセキュリティアップデート
- [ ] ログの監視
- [ ] バックアップの確認

## パフォーマンス最適化

### データベース最適化
- インデックスの追加
- クエリの最適化
- 接続プールの設定

### アプリケーション最適化
- Next.js Image最適化
- コード分割
- キャッシュの活用

### インフラ最適化
- CDNの導入
- ロードバランサーの設定
- オートスケーリングの設定
