# ワークスペース構成ガイド

## 📁 最適化されたディレクトリ構造

```
group-dating-app/
├── 📄 プロジェクトファイル
│   ├── README.md                    # プロジェクト概要
│   ├── DEVELOPMENT.md               # 開発者向けガイド
│   ├── API_DOCUMENTATION.md         # API仕様書
│   ├── ARCHITECTURE.md              # アーキテクチャ説明
│   ├── DEPLOYMENT.md                # デプロイメントガイド
│   ├── WORKSPACE_GUIDE.md           # このファイル
│   ├── CODEBASE_OVERVIEW.md         # コードベース概要
│   ├── package.json                 # 依存関係とスクリプト
│   ├── tsconfig.json                # TypeScript設定
│   ├── next.config.js               # Next.js設定
│   ├── tailwind.config.js           # Tailwind CSS設定
│   ├── postcss.config.js            # PostCSS設定
│   ├── Dockerfile                   # Docker設定
│   ├── docker-compose.yml           # Docker Compose設定
│   └── env.example                  # 環境変数テンプレート
│
├── 📁 .vscode/                      # VS Code設定
│   ├── settings.json                # エディタ設定
│   ├── extensions.json              # 推奨拡張機能
│   ├── launch.json                  # デバッグ設定
│   └── tasks.json                   # タスク設定
│
├── 📁 app/                          # Next.js App Router
│   ├── 📁 api/                      # API エンドポイント
│   ├── 📁 auth/                     # 認証ページ
│   ├── 📁 teams/                    # チーム関連ページ
│   ├── 📁 chat/                     # チャットページ
│   ├── 📁 meeting/                  # ミーティングページ
│   ├── 📁 admin/                    # 管理者ページ
│   ├── globals.css                  # グローバルスタイル
│   └── layout.tsx                   # ルートレイアウト
│
├── 📁 components/                   # React コンポーネント
│   ├── README.md                    # コンポーネント説明
│   ├── 📁 ui/                       # UI コンポーネント
│   ├── 📁 features/                 # 機能別コンポーネント
│   ├── 📁 layouts/                  # レイアウトコンポーネント
│   └── 📁 vote/                     # 投票関連コンポーネント
│
├── 📁 lib/                          # ライブラリ・ユーティリティ
│   ├── 📁 hooks/                    # カスタムフック
│   ├── 📁 types/                    # 型定義
│   ├── 📁 utils/                    # ユーティリティ関数
│   └── prisma.ts                    # Prisma設定
│
├── 📁 types/                        # グローバル型定義
│   ├── index.ts                     # 共通型定義
│   ├── global.d.ts                  # グローバル型定義
│   └── next.d.ts                    # Next.js型定義
│
├── 📁 utils/                        # ユーティリティ関数
│   ├── 📁 api/                      # API関連
│   ├── 📁 auth/                     # 認証関連
│   ├── 📁 errors/                   # エラーハンドリング
│   └── 📁 validators/               # バリデーション
│
├── 📁 middleware/                   # ミドルウェア
│   ├── api.ts                       # API ミドルウェア
│   ├── auth.ts                      # 認証ミドルウェア
│   ├── adminAuth.ts                 # 管理者認証
│   └── errorHandler.ts              # エラーハンドリング
│
├── 📁 config/                       # 設定ファイル
│   ├── development.ts               # 開発環境設定
│   ├── index.ts                     # 設定エクスポート
│   └── 📁 workspace/                # ワークスペース設定
│       ├── jest.config.js           # Jest設定
│       ├── jest.setup.js            # Jestセットアップ
│       ├── playwright.config.ts     # Playwright設定
│       └── tsconfig.scripts.json    # スクリプト用TS設定
│
├── 📁 scripts/                      # スクリプト
│   ├── 📁 development/              # 開発用スクリプト
│   │   ├── seed.ts                  # データシード
│   │   ├── check_team_photos.js     # チーム写真チェック
│   │   ├── check-db-structure.js    # DB構造チェック
│   │   └── debug-prisma.js          # Prismaデバッグ
│   └── 📁 production/               # 本番用スクリプト
│       └── cleanup-production.sh    # 本番環境クリーンアップ
│
├── 📁 prisma/                       # データベース
│   ├── schema.prisma                # データベーススキーマ
│   └── 📁 migrations/               # マイグレーション
│
├── 📁 infra/                        # インフラ設定
│   ├── README.md                    # インフラ説明
│   ├── 📁 scripts/                  # インフラスクリプト
│   └── 📁 terraform/                # Terraform設定
│
├── 📁 contexts/                     # React Context
│   ├── AuthContext.tsx              # 認証コンテキスト
│   └── ActiveTeamContext.tsx        # アクティブチームコンテキスト
│
├── 📁 docs/                         # ドキュメント
│   ├── active-team-constraint.md    # アクティブチーム制約
│   ├── invite-link-testing.md       # 招待リンクテスト
│   ├── match-success-modal.md       # マッチ成功モーダル
│   ├── social-auth-integration.md   # ソーシャル認証統合
│   ├── swipe-functionality.md       # スワイプ機能
│   └── voice-call-setup.md          # 音声通話設定
│
├── 📁 public/                       # 静的ファイル
│   ├── 📁 images/                   # 画像ファイル
│   └── 📁 icons/                    # アイコンファイル
│
└── 📁 data/                         # データファイル
    └── verifications.json           # 認証データ
```

## 🛠️ 開発環境セットアップ

### 1. 前提条件
- Node.js 18+
- npm または yarn
- VS Code（推奨）
- Git

### 2. 初期セットアップ
```bash
# リポジトリのクローン
git clone <repository-url>
cd group-dating-app

# 依存関係のインストール
npm install

# 環境変数の設定
cp env.example .env.local
# .env.local を編集

# データベースのセットアップ
npm run db:push

# 開発サーバーの起動
npm run dev
```

### 3. VS Code設定
プロジェクトには以下のVS Code設定が含まれています：

- **推奨拡張機能**: `.vscode/extensions.json`
- **エディタ設定**: `.vscode/settings.json`
- **デバッグ設定**: `.vscode/launch.json`
- **タスク設定**: `.vscode/tasks.json`

## 📋 利用可能なスクリプト

### 開発用スクリプト
```bash
# 開発サーバー起動
npm run dev

# 型チェック
npm run type-check

# リント
npm run lint
npm run lint:fix

# テスト
npm run test
npm run test:watch
npm run test:coverage
npm run test:e2e
npm run test:e2e:ui

# データベース
npm run db:push
npm run db:studio
npm run db:generate
npm run db:migrate
npm run db:seed

# クリーンアップ
npm run clean
npm run clean:all
```

### 本番用スクリプト
```bash
# ビルド
npm run build

# 本番サーバー起動
npm run start:prod

# 本番環境クリーンアップ
npm run clean:production

# Docker
npm run docker:build
npm run docker:run
npm run docker:compose

# デプロイ
npm run deploy:staging
npm run deploy:production
```

### インフラ用スクリプト
```bash
# AWS プロビジョニング
npm run infra:provision

# Terraform
npm run infra:terraform:init
npm run infra:terraform:plan
npm run infra:terraform:apply
npm run infra:terraform:destroy
```

## 🔧 設定ファイルの説明

### TypeScript設定
- **`tsconfig.json`**: メインのTypeScript設定（厳密な型チェック）
- **`config/workspace/tsconfig.scripts.json`**: スクリプト用の設定

### テスト設定
- **`config/workspace/jest.config.js`**: Jest設定
- **`config/workspace/jest.setup.js`**: Jestセットアップ
- **`config/workspace/playwright.config.ts`**: Playwright設定

### その他の設定
- **`next.config.js`**: Next.js設定
- **`tailwind.config.js`**: Tailwind CSS設定
- **`postcss.config.js`**: PostCSS設定

## 📁 ディレクトリの役割

### `/app`
Next.js App RouterのページとAPIエンドポイント

### `/components`
再利用可能なReactコンポーネント

### `/lib`
ライブラリ、ユーティリティ、カスタムフック

### `/types`
TypeScriptの型定義

### `/utils`
API、認証、エラーハンドリング、バリデーション関連のユーティリティ

### `/middleware`
Next.jsミドルウェア

### `/config`
設定ファイル（環境別、ワークスペース別）

### `/scripts`
開発・本番用のスクリプト

### `/prisma`
データベーススキーマとマイグレーション

### `/infra`
インフラ設定（AWS、Terraform）

### `/docs`
プロジェクトドキュメント

## 🚀 開発ワークフロー

### 1. 新機能開発
```bash
# ブランチ作成
git checkout -b feature/new-feature

# 開発サーバー起動
npm run dev

# 型チェック
npm run type-check

# テスト実行
npm run test

# コミット
git add .
git commit -m "feat: add new feature"
```

### 2. コードレビュー前
```bash
# リント修正
npm run lint:fix

# 型チェック
npm run type-check

# テスト実行
npm run test

# フォーマット
npm run format
```

### 3. 本番デプロイ前
```bash
# 本番環境クリーンアップ
npm run clean:production

# ビルド
npm run build

# 本番サーバーテスト
npm run start:prod
```

## 🔍 トラブルシューティング

### よくある問題

#### 1. 型エラー
```bash
# 型チェック実行
npm run type-check

# Prismaクライアント再生成
npm run db:generate
```

#### 2. データベース接続エラー
```bash
# データベース接続確認
npm run db:push

# Prisma Studio起動
npm run db:studio
```

#### 3. 依存関係エラー
```bash
# 依存関係再インストール
npm run clean:all
```

#### 4. ビルドエラー
```bash
# キャッシュクリア
npm run clean

# 再ビルド
npm run build
```

## 📚 参考資料

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)

## 🤝 貢献ガイドライン

1. このワークスペース構成を理解する
2. 適切なディレクトリにファイルを配置する
3. 命名規則に従う
4. ドキュメントを更新する
5. テストを追加する

---

**最終更新**: 2024年12月
**バージョン**: 1.0.0
