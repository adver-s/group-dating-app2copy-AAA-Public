# アーキテクチャドキュメント

## システム概要

Gather-sは、Next.js 15をベースとしたフルスタックWebアプリケーションです。グループデートマッチング機能を提供し、チーム作成からマッチング、チャット、ミーティング管理まで一貫したユーザー体験を提供します。

## 技術スタック

### フロントエンド
- **Next.js 15**: React フレームワーク（App Router使用）
- **TypeScript**: 型安全性の確保
- **Tailwind CSS**: スタイリング
- **Framer Motion**: アニメーション
- **React Hook Form**: フォーム管理

### バックエンド
- **Next.js API Routes**: API エンドポイント
- **Prisma**: ORM（データベース操作）
- **MySQL**: データベース（AWS Aurora）
- **JWT**: 認証・認可

### インフラ・サービス
- **AWS EC2**: サーバー
- **AWS Aurora**: データベース
- **AWS S3**: ファイルストレージ
- **AWS Chime**: 音声通話
- **AWS Secrets Manager**: 機密情報管理

## アーキテクチャ図

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   フロントエンド   │    │   バックエンド     │    │   インフラ       │
│                 │    │                 │    │                 │
│  Next.js 15     │◄──►│  API Routes     │◄──►│  AWS EC2        │
│  React 19       │    │  Prisma ORM     │    │  Aurora MySQL   │
│  TypeScript     │    │  JWT Auth       │    │  S3 Storage     │
│  Tailwind CSS   │    │  Error Handling │    │  Chime SDK      │
│  Framer Motion  │    │  Validation     │    │  Secrets Mgr    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ディレクトリ構造

```
group-dating-app/
├── app/                    # Next.js App Router
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
├── middleware/           # ミドルウェア
├── prisma/               # データベーススキーマ
├── types/                # TypeScript 型定義
├── utils/                # ユーティリティ関数
│   ├── api/             # API関連
│   ├── auth/            # 認証関連
│   ├── errors/          # エラーハンドリング
│   └── validators/      # バリデーション
└── infra/                # インフラ設定
```

## データベース設計

### 主要テーブル

#### Users
```sql
- id: String (Primary Key)
- email: String (Unique)
- name: String
- age: Int
- gender: Int
- profileImage: String
- createdAt: DateTime
- updatedAt: DateTime
```

#### Teams
```sql
- id: String (Primary Key)
- name: String
- description: String
- gender: Int
- targetGender: Int
- maxMembers: Int
- isActive: Boolean
- createdAt: DateTime
- updatedAt: DateTime
```

#### TeamMembers
```sql
- id: String (Primary Key)
- teamId: String (Foreign Key)
- userId: String (Foreign Key)
- joinedAt: DateTime
- isActive: Boolean
```

#### Matches
```sql
- id: String (Primary Key)
- team1Id: String (Foreign Key)
- team2Id: String (Foreign Key)
- status: Enum
- createdAt: DateTime
- updatedAt: DateTime
```

#### ChatRooms
```sql
- id: String (Primary Key)
- name: String
- type: Enum
- team1Id: String (Foreign Key)
- team2Id: String (Foreign Key)
- createdAt: DateTime
- updatedAt: DateTime
```

#### ChatMessages
```sql
- id: String (Primary Key)
- roomId: String (Foreign Key)
- userId: String (Foreign Key)
- content: String
- type: Enum
- createdAt: DateTime
```

## API設計

### RESTful API原則

- **GET**: リソースの取得
- **POST**: リソースの作成
- **PUT**: リソースの更新
- **DELETE**: リソースの削除

### エンドポイント例

```
GET    /api/teams              # チーム一覧取得
POST   /api/teams              # チーム作成
GET    /api/teams/{id}         # チーム詳細取得
PUT    /api/teams/{id}         # チーム更新
DELETE /api/teams/{id}         # チーム削除

GET    /api/matching/candidates # マッチング候補取得
POST   /api/matching/judgements # マッチング判定

GET    /api/chat/rooms         # チャットルーム一覧
GET    /api/chat/{roomId}      # メッセージ取得
POST   /api/chat/{roomId}      # メッセージ送信
```

### レスポンス形式

#### 成功レスポンス
```json
{
  "success": true,
  "data": { ... },
  "message": "操作が正常に完了しました"
}
```

#### エラーレスポンス
```json
{
  "error": "エラーメッセージ",
  "code": "ERROR_CODE",
  "details": "詳細情報（開発環境のみ）"
}
```

## 認証・認可

### JWT認証
- すべてのAPIエンドポイントでJWT認証を実装
- トークンの有効期限: 24時間
- リフレッシュトークン機能（将来実装予定）

### 認可レベル
1. **公開**: 認証不要
2. **認証済み**: ログインユーザーのみ
3. **管理者**: 管理者権限が必要

## エラーハンドリング

### エラーレベル
1. **ValidationError**: 入力値エラー（400）
2. **AuthenticationError**: 認証エラー（401）
3. **AuthorizationError**: 認可エラー（403）
4. **NotFoundError**: リソース未発見（404）
5. **DatabaseError**: データベースエラー（500）
6. **ExternalApiError**: 外部APIエラー（502）

### ログ戦略
- 開発環境: コンソールログ
- 本番環境: AWS CloudWatch（将来実装予定）

## セキュリティ

### データ保護
- パスワードのハッシュ化（bcrypt）
- JWTトークンの暗号化
- HTTPS通信の強制

### 入力値検証
- フロントエンド: React Hook Form + Zod
- バックエンド: カスタムバリデーター

### レート制限
- API呼び出し制限: 100回/分
- 認証API: 10回/分

## パフォーマンス

### 最適化戦略
- Next.js Image最適化
- データベースクエリの最適化
- キャッシュ戦略（将来実装予定）

### 監視
- レスポンス時間の監視
- エラー率の監視
- データベース接続プールの監視

## デプロイメント

### 環境
- **開発**: ローカル環境
- **ステージング**: AWS EC2
- **本番**: AWS EC2

### CI/CD
- GitHub Actions（将来実装予定）
- 自動テスト実行
- 自動デプロイ

## 今後の拡張予定

### 機能拡張
- プッシュ通知
- リアルタイム通信（WebSocket）
- 動画通話機能
- 位置情報ベースのマッチング

### 技術改善
- マイクロサービス化
- GraphQL API
- Redis キャッシュ
- CDN導入

## 運用・保守

### 監視項目
- アプリケーションの可用性
- データベースのパフォーマンス
- エラー率
- ユーザーアクティビティ

### バックアップ戦略
- データベースの日次バックアップ
- S3のバージョニング
- 設定ファイルのバージョン管理
