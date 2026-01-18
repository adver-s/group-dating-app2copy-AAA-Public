# アクティブチーム制約システム

## 概要

このシステムは、一人のユーザーがアクティブグループとして設定できるグループの上限数を1つに制限する制約を実装しています。

## 制約の詳細

- **制約内容**: 一人のユーザーは最大1つのアクティブグループのみを持つことができます
- **実装方法**: データベースレベルでの制約とアプリケーションレベルでの制約の両方を実装
- **自動修正**: 制約違反が検出された場合、自動的に修正されます

## データベース構造

### TeamMemberテーブル
```sql
CREATE TABLE team_members (
  id VARCHAR(36) PRIMARY KEY,
  team_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_team_user (team_id, user_id),
  INDEX idx_team_id (team_id),
  INDEX idx_user_id (user_id),
  INDEX idx_user_active (user_id, is_active) -- 新規追加
);
```

### 制約の仕組み
- `is_active`フィールドでアクティブ状態を管理
- 一人のユーザーが複数の`is_active = TRUE`を持つことを防ぐ
- 新しいチームをアクティブにする際、他のチームは自動的に非アクティブになる

## 実装されたファイル

### 1. 制約管理クラス
- `utils/team-constraints.ts` - 制約を管理するメインクラス

### 2. APIエンドポイント
- `app/api/teams/[id]/activate/route.ts` - チームアクティブ化API（更新）
- `app/api/teams/[id]/toggle-active/route.ts` - チームアクティブ状態切り替えAPI（更新）
- `app/api/teams/route.ts` - チーム一覧API（制約情報追加）
- `app/api/debug/check-active-constraint/route.ts` - 制約チェック用デバッグAPI
- `app/api/test/active-constraint/route.ts` - 制約テスト用API

### 3. マイグレーション
- `infra/scripts/enforceActiveTeamConstraint.js` - 既存データへの制約適用スクリプト

## 使用方法

### 基本的な制約チェック
```typescript
import { TeamActiveConstraint } from '@/utils/team-constraints';

// 制約の状態をチェック
const validation = await TeamActiveConstraint.validateConstraint(userId);
console.log('制約は有効か:', validation.isValid);
console.log('アクティブチーム数:', validation.activeCount);
```

### チームをアクティブに設定
```typescript
// 他のチームは自動的に非アクティブになる
await TeamActiveConstraint.setActiveTeam(userId, teamId);
```

### チームを非アクティブに設定
```typescript
await TeamActiveConstraint.setInactiveTeam(userId, teamId);
```

### 制約の強制適用
```typescript
// 制約違反がある場合、最初のチーム以外を非アクティブにする
await TeamActiveConstraint.enforceConstraint(userId);
```

## APIエンドポイント

### チーム一覧取得（制約情報付き）
```
GET /api/teams
```

レスポンス例:
```json
{
  "success": true,
  "activeGroups": [...],
  "waitingGroups": [...],
  "constraint": {
    "isValid": true,
    "activeCount": 1,
    "maxActiveTeams": 1,
    "message": "制約は正常です"
  }
}
```

### 制約テストAPI
```
GET /api/test/active-constraint?action=check&userId=xxx
GET /api/test/active-constraint?action=enforce&userId=xxx
GET /api/test/active-constraint?action=set-active&userId=xxx&teamId=xxx
GET /api/test/active-constraint?action=set-inactive&userId=xxx&teamId=xxx
```

### デバッグ用API
```
GET /api/debug/check-active-constraint?userId=xxx
```

## 制約の動作

### 1. チームアクティブ化時
- ユーザーの他のすべてのチームが非アクティブになる
- 指定されたチームのみがアクティブになる
- トランザクションで安全に実行される

### 2. 制約違反検出時
- 複数のアクティブチームが検出された場合
- 最初に参加したチーム（`joined_at`順）を保持
- 他のチームは自動的に非アクティブに設定

### 3. 自動修正
- チーム一覧取得時に制約チェックが実行される
- 違反が検出された場合、自動的に修正される
- 修正内容がログに記録される

## エラーハンドリング

### 一般的なエラー
- チームメンバーでない場合: "このチームのメンバーではありません"
- データベースエラー: 適切なエラーメッセージとログ出力

### 制約違反エラー
- 制約違反は自動的に修正される
- 修正内容はAPIレスポンスに含まれる

## ログ出力

制約関連の操作は以下の形式でログに記録されます：

```
🔧 === チームアクティブ化API開始 ===
🔍 User ID: xxx
🔍 Team ID: xxx
✅ User xxx activated team xxx
⚠️ 制約違反を検出。自動修正を実行します。
✅ 制約違反を自動修正しました
```

## テスト

### 手動テスト
1. 複数のチームに所属するユーザーを作成
2. 複数のチームをアクティブに設定
3. 制約が正しく適用されることを確認

### APIテスト
```bash
# 制約状態をチェック
curl "http://localhost:3000/api/test/active-constraint?action=check&userId=xxx"

# 制約を強制適用
curl "http://localhost:3000/api/test/active-constraint?action=enforce&userId=xxx"

# チームをアクティブに設定
curl "http://localhost:3000/api/test/active-constraint?action=set-active&userId=xxx&teamId=xxx"
```

## 今後の改善点

1. **データベースレベルでの制約**: CHECK制約やトリガーでの実装
2. **パフォーマンス最適化**: インデックスの最適化
3. **監査ログ**: 制約変更の履歴記録
4. **通知機能**: 制約違反時のユーザー通知

## 注意事項

- 既存のデータに対して制約を適用する場合は、マイグレーションスクリプトを実行してください
- 制約違反は自動的に修正されますが、ユーザーには適切な通知を行ってください
- パフォーマンスを考慮し、大量のデータがある場合はバッチ処理を検討してください
