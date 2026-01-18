# グループデートアプリ (Monorepo)

## 概要

- Next.js 15 (App Router) でフロントと API を同居させたフルスタック構成。
- グループ作成/招待、マッチング（スワイプ・判定）、チャット、ミーティング調整、管理者による本人確認・写真レビュー・フィードバック管理までを網羅。
- Prisma + SQLite（デフォルト: `apps/api/prisma/dev.sql.db`）でスキーマを管理。Aurora/MySQL に切り替える場合は接続文字列と provider を合わせてください。
- AWS 連携（S3 アップロード、Chime、Rekognition/Comprehend、DynamoDB/SNS など）とローカル JSON ストアを併用しています。

## リポジトリ構成

```
apps/
  web/      # Next.js 本体（UI + app/api エンドポイント）
  api/      # Prisma スキーマとサーバー向けユーティリティ
packages/
  schema/   # 共有型定義 (tsc -b 対象)
  ui/       # 共有 UI
infra/      # Dockerfile / docker-compose / Terraform / AWS scripts
docs/       # ガイド類 (ARCHITECTURE.md など)
scripts/    # 開発・運用スクリプト
config/     # Jest/Playwright/ts-node 設定
env.example # 環境変数サンプル
```

## 必要環境

- Node.js 18+（Next.js 15 の要件に準拠）
- npm（ワークスペース利用）
- SQLite ローカルファイル または MySQL/Aurora（`DATABASE_URL_SQL` を設定）

## セットアップ

```bash
npm install
npm run build:packages          # packages/schema, packages/ui をビルド
cp env.example .env.local

# 開発用 DB（デフォルトは SQLite ファイル）を作成
npm run db:push                 # prisma db push (apps/api)

# Next.js 開発サーバー
npm run dev                     # http://localhost:3000
```

## 環境変数の要点

- `DATABASE_URL_SQL`: Prisma 用。未設定なら `file:./apps/api/prisma/dev.sql.db` を使用。
- `JWT_SECRET_KEY`, `JWT_EXPIRES_IN`: 認証トークン設定。
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`: AWS 共通。
- `S3_BUCKET_NAME`, `S3_REGION`: 写真アップロード用。
- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_BASE_URL`: フロント/Api のベース URL。
- そのほかは `env.example` / `env.production.example` を参照。Aurora/MySQL で運用する場合は Prisma の provider と接続文字列を合わせてください。

## 実行・ビルド・チェック

- 開発/ビルド/起動: `npm run dev` / `npm run build` / `npm run start`
- 型: `npm run type-check`
- Lint: `npm run lint` / `npm run lint:fix`
- フォーマット: `npm run format` / `npm run format:check`
- テスト: `npm run test` / `npm run test:watch` / `npm run test:coverage`
- E2E: `npm run test:e2e` / `npm run test:e2e:ui`

## DB & データ

- スキーマ: `apps/api/prisma/schema.prisma`（現在 provider = sqlite, env `DATABASE_URL_SQL`）。
- マイグレーション: `apps/api/prisma/migrations/`。`npm run db:migrate` / `npm run db:deploy`。
- シード: `npm run db:seed`（`scripts/development/seed.ts` を実行）。
- NoSQL ローカルストア: `apps/api/utils/local-nosql.ts` 経由でチャット/判定履歴を JSON 保存。

## 機能の目安

- 認証: `/app/api/auth/*` と `/app/auth/*`。
- チーム・招待・プロフィール: `/app/api/teams/*`, `/app/invite/*`, `/app/me/*`。
- マッチング/スワイプ: `/app/api/matching/*`, `/app/match*`。
- マッチ成立後チャット: `/app/api/team-chat/*`, `/app/team-chat/*`, `/app/chat/*`。
- ミーティング調整: `/app/api/meeting/*`, `/app/meeting/*`。
- 管理者: `/app/admin/*` と対応する `/app/api/admin/*`（本人確認・写真レビュー・フィードバックエクスポート）。

## インフラ・デプロイ

- Docker: `infra/Dockerfile`, `infra/docker-compose.dev.yml`, `infra/docker-compose.yml`。
- Terraform: `infra/terraform/`（Aurora/EC2/S3 など）。
- AWS 向けスクリプト: `infra/scripts/` と `scripts/*.js` に運用補助ツール。
- デプロイ: `scripts/deploy-staging.sh`, `scripts/production/deploy-production.sh` など（環境に合わせて確認）。

## ドキュメント

- `docs/` 配下にアーキテクチャ/開発/デプロイ/機能別メモ (`ARCHITECTURE.md`, `DEVELOPMENT.md`, `AWS_DEPLOYMENT_GUIDE.md`, `CODEBASE_OVERVIEW.md` など)。
- API 仕様: `API_DOCUMENTATION.md`。

## 注意点

- `.next/` やアップロード済みファイルはビルド/ランタイム成果物のためコミット対象外。
- Prisma の provider と `.env` の DB 設定がズレないよう確認してください（デフォルトは SQLite ファイル）。
