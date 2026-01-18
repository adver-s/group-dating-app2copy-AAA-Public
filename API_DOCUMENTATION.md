# API ドキュメント

## 概要

このドキュメントでは、グループデートアプリの API エンドポイントについて説明します。

## 認証

すべての API エンドポイント（公開エンドポイントを除く）は JWT 認証が必要です。

```bash
Authorization: Bearer <JWT_TOKEN>
```

## エラーレスポンス

すべてのエラーは以下の形式で返されます：

```json
{
  "error": "エラーメッセージ",
  "code": "ERROR_CODE",
  "details": "詳細情報（オプション）"
}
```

## エンドポイント一覧

### 認証 API

#### POST /api/auth/signup
ユーザー登録

**リクエスト:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "ユーザー名"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "ユーザーが正常に登録されました",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "ユーザー名"
  }
}
```

#### POST /api/auth/signin
ユーザーログイン

**リクエスト:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "ユーザー名"
  }
}
```

#### POST /api/auth/simple-login
開発用簡易ログイン

**リクエスト:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "ユーザー名（新規ユーザーの場合）"
}
```

### チーム管理 API

#### GET /api/teams
ユーザーのチーム一覧取得

**レスポンス:**
```json
{
  "teams": [
    {
      "id": "team_id",
      "name": "チーム名",
      "description": "チーム説明",
      "gender": 1,
      "targetGender": 1,
      "maxMembers": 4,
      "isActive": true,
      "members": [
        {
          "id": "member_id",
          "user": {
            "id": "user_id",
            "name": "ユーザー名"
          }
        }
      ]
    }
  ]
}
```

#### POST /api/teams
チーム作成

**リクエスト:**
```json
{
  "name": "チーム名",
  "description": "チーム説明",
  "gender": 1,
  "targetGender": 1,
  "maxMembers": 4,
  "images": ["base64_image_data"],
  "hobbies": ["読書", "映画"],
  "preferredPrefs": ["東京", "神奈川"],
  "availabilities": [
    {
      "weekday": 1,
      "timeslot": "evening"
    }
  ]
}
```

#### GET /api/teams/[id]
チーム詳細取得

#### PUT /api/teams/[id]
チーム更新

#### DELETE /api/teams/[id]
チーム削除

### 招待システム API

#### GET /api/teams/[id]/invite-code
招待コード取得

**レスポンス:**
```json
{
  "inviteCode": "ABC123XY",
  "expiresAt": "2024-01-01T00:00:00Z"
}
```

#### POST /api/teams/[id]/invite-code
招待コード再生成

#### GET /api/invite/[code]
招待情報取得

**レスポンス:**
```json
{
  "team": {
    "id": "team_id",
    "name": "チーム名",
    "description": "チーム説明",
    "currentMembers": 2,
    "maxMembers": 4
  },
  "expiresAt": "2024-01-01T00:00:00Z"
}
```

#### POST /api/invite/[code]/join
招待コードでチーム参加

### マッチング API

#### GET /api/matching/candidates
マッチング候補取得

**レスポンス:**
```json
{
  "candidates": [
    {
      "id": "team_id",
      "name": "チーム名",
      "description": "チーム説明",
      "gender": 1,
      "targetGender": 1,
      "currentMembers": 2,
      "maxMembers": 4,
      "photos": ["photo_url"],
      "hobbies": ["読書", "映画"],
      "preferredPrefs": ["東京", "神奈川"]
    }
  ]
}
```

#### POST /api/matching/judgements
マッチング判定

**リクエスト:**
```json
{
  "targetTeamId": "team_id",
  "judgement": "like" // "like" or "reject"
}
```

#### GET /api/matches
マッチ一覧取得

**レスポンス:**
```json
{
  "matches": [
    {
      "id": "match_id",
      "team1": {
        "id": "team_id",
        "name": "チーム名"
      },
      "team2": {
        "id": "team_id",
        "name": "チーム名"
      },
      "status": "matched",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### チャット API

#### GET /api/chat/rooms
チャットルーム一覧取得

#### GET /api/chat/[roomId]
チャットメッセージ取得

**クエリパラメータ:**
- `page`: ページ番号（デフォルト: 1）
- `limit`: 取得件数（デフォルト: 50）

#### POST /api/chat/[roomId]
メッセージ送信

**リクエスト:**
```json
{
  "content": "メッセージ内容",
  "type": "text" // "text", "image", "file"
}
```

### ミーティング API

#### GET /api/meeting/proposals
ミーティング提案一覧取得

#### POST /api/meeting/proposals
ミーティング提案作成

**リクエスト:**
```json
{
  "targetTeamId": "team_id",
  "proposedDate": "2024-01-01T18:00:00Z",
  "location": "会議場所",
  "message": "提案メッセージ"
}
```

#### POST /api/meeting/proposals/[id]/respond
ミーティング提案への回答

**リクエスト:**
```json
{
  "response": "accept" // "accept" or "reject"
}
```

### 管理者 API

#### GET /api/admin/feedback
フィードバック一覧取得（管理者のみ）

#### POST /api/admin/feedback/[id]/resolve
フィードバック解決（管理者のみ）

#### GET /api/admin/verifications
認証待ち一覧取得（管理者のみ）

#### POST /api/admin/verifications/[id]/approve
認証承認（管理者のみ）

## ステータスコード

- `200`: 成功
- `201`: 作成成功
- `400`: リクエストエラー
- `401`: 認証エラー
- `403`: 権限エラー
- `404`: リソースが見つからない
- `500`: サーバーエラー

## レート制限

API には以下のレート制限が適用されます：

- 認証 API: 1分間に10回
- その他の API: 1分間に100回

レート制限に達した場合、`429 Too Many Requests` が返されます。

## サンプルコード

### JavaScript (fetch)

```javascript
// ログイン
const loginResponse = await fetch('/api/auth/signin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { token } = await loginResponse.json();

// 認証が必要な API の呼び出し
const teamsResponse = await fetch('/api/teams', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { teams } = await teamsResponse.json();
```

### cURL

```bash
# ログイン
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# チーム一覧取得
curl -X GET http://localhost:3000/api/teams \
  -H "Authorization: Bearer <JWT_TOKEN>"
```
