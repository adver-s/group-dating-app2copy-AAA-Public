# 開発者向けガイド

## プロジェクト概要

このアプリはグループデートマッチングアプリケーションです。チームを作成し、他のチームとマッチングしてグループデートを企画できます。

## 主要機能

### 1. 認証システム
- JWT ベースの認証
- 簡単ログイン（開発用）
- ユーザー登録・ログイン

### 2. チーム管理
- チーム作成・編集
- メンバー招待（招待コードシステム）
- チーム写真アップロード
- チーム設定（性別、趣味、都道府県、空き時間）

### 3. マッチングシステム
- チーム間のマッチング
- スワイプ機能
- マッチング結果の管理

### 4. チャット機能
- チーム内チャット
- マッチしたチーム間のチャット
- 音声通話機能（AWS Chime）

### 5. ミーティング管理
- ミーティング提案・承認
- スケジュール調整
- ミーティング確認・キャンセル

## 技術スタック

### フロントエンド
- **Next.js 15**: React フレームワーク
- **TypeScript**: 型安全性
- **Tailwind CSS**: スタイリング
- **Framer Motion**: アニメーション
- **React Hook Form**: フォーム管理

### バックエンド
- **Next.js API Routes**: API エンドポイント
- **Prisma**: ORM
- **MySQL**: データベース（AWS Aurora）
- **JWT**: 認証

### AWS サービス
- **EC2**: サーバー
- **Aurora**: データベース
- **S3**: ファイルストレージ
- **Chime**: 音声通話
- **Secrets Manager**: 機密情報管理

## プロジェクト構造

```
├── app/                    # Next.js アプリケーション
│   ├── api/               # API エンドポイント
│   │   ├── auth/          # 認証関連
│   │   ├── teams/         # チーム管理
│   │   ├── matching/      # マッチング
│   │   ├── chat/          # チャット
│   │   ├── meeting/       # ミーティング
│   │   └── admin/         # 管理者機能
│   ├── auth/              # 認証ページ
│   ├── teams/             # チーム関連ページ
│   ├── chat/              # チャットページ
│   ├── meeting/           # ミーティングページ
│   └── admin/             # 管理者ページ
├── components/            # React コンポーネント
│   ├── ui/               # UI コンポーネント
│   ├── features/         # 機能別コンポーネント
│   └── layouts/          # レイアウトコンポーネント
├── contexts/             # React Context
├── hooks/                # カスタムフック
├── lib/                  # ライブラリ設定
├── prisma/               # データベーススキーマ
├── utils/                # ユーティリティ関数
├── types/                # TypeScript 型定義
└── infra/                # インフラ設定
```

## 開発環境セットアップ

### 1. 前提条件
- Node.js 18+
- npm または yarn
- MySQL または AWS Aurora へのアクセス

### 2. インストール
```bash
# リポジトリのクローン
git clone <repository-url>
cd group-dating-app

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.local を編集して必要な値を設定
```

### 3. データベースセットアップ
```bash
# Prisma マイグレーション
npx prisma db push

# 開発用データの投入（オプション）
npm run seed:test-users
```

### 4. 開発サーバー起動
```bash
npm run dev
```

## 環境変数

### 必須の環境変数
```bash
# データベース
DATABASE_URL="mysql://user:password@host:port/database"

# JWT
JWT_SECRET_KEY="your-secret-key"
JWT_EXPIRES_IN="24h"

# AWS
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="ap-northeast-1"

# アプリケーション
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

## 開発ガイドライン

### 1. コーディング規約
- TypeScript を使用し、any 型は避ける
- ESLint と Prettier の設定に従う
- コンポーネントは機能別に分離する
- API エンドポイントは RESTful に設計する

### 2. データベース
- Prisma スキーマを使用してデータベース操作
- マイグレーションは慎重に行う
- 本番環境では必ずバックアップを取る

### 3. 認証・認可
- すべての API エンドポイントで JWT 認証を実装
- 管理者機能は適切な権限チェックを行う
- 機密情報は環境変数で管理

### 4. エラーハンドリング
- 統一されたエラーレスポンス形式を使用
- 適切な HTTP ステータスコードを返す
- エラーログを記録する

## デバッグ・テスト

### 開発用エンドポイント
開発時は以下のエンドポイントが利用可能です：
- `/api/debug/*`: デバッグ用 API
- `/debug/*`: デバッグ用ページ
- `/test-*`: テスト用ページ

**注意**: これらのエンドポイントは本番環境では無効化されます。

### テスト実行
```bash
# 単体テスト
npm test

# テストカバレッジ
npm run test:coverage

# E2E テスト
npm run test:e2e
```

## デプロイ

### 1. 本番環境へのデプロイ
```bash
# ビルド
npm run build

# 本番サーバー起動
npm run start:prod
```

### 2. Docker でのデプロイ
```bash
# イメージビルド
docker build -t group-dating-app .

# コンテナ実行
docker run -p 3000:3000 group-dating-app
```

### 3. AWS EC2 へのデプロイ
詳細は `AWS_DEPLOYMENT_GUIDE.md` を参照してください。

## トラブルシューティング

### よくある問題

1. **データベース接続エラー**
   - 環境変数の確認
   - ネットワーク接続の確認
   - データベースサービスの状態確認

2. **認証エラー**
   - JWT トークンの有効性確認
   - 環境変数の確認
   - トークンの有効期限確認

3. **AWS サービスエラー**
   - AWS 認証情報の確認
   - リージョン設定の確認
   - 権限設定の確認

## 貢献ガイドライン

1. 新しい機能を追加する前に、既存のコードを理解する
2. プルリクエストを作成する前に、テストを実行する
3. コードレビューを必ず受ける
4. ドキュメントを更新する

## ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。
