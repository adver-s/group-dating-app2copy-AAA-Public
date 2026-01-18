# 音声通話機能セットアップガイド

このガイドでは、Amazon Chime SDKを使用した音声通話機能の設定方法を説明します。

## 前提条件

- AWSアカウント
- 適切なIAM権限を持つAWS認証情報
- Node.js 16以上

## 1. AWS認証情報の設定

### 1.1 IAMユーザーの作成

AWS IAMコンソールで以下の権限を持つユーザーを作成してください：

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "chime:CreateMeeting",
                "chime:CreateAttendee",
                "chime:DeleteMeeting",
                "chime:DeleteAttendee",
                "chime:ListMeetings",
                "chime:GetMeeting"
            ],
            "Resource": "*"
        }
    ]
}
```

### 1.2 環境変数の設定

`.env.local`ファイルに以下の設定を追加してください：

```env
# AWS Configuration
AWS_REGION="ap-northeast-1"
AWS_ACCESS_KEY_ID="your_access_key_id"
AWS_SECRET_ACCESS_KEY="your_secret_access_key"

# Amazon Chime SDK Configuration (オプション)
CHIME_SQS_QUEUE_ARN="arn:aws:sqs:region:account:queue-name"
```

## 2. 依存関係のインストール

```bash
npm install amazon-chime-sdk-js@3.0.0 @aws-sdk/client-chime-sdk-meetings --legacy-peer-deps
```

## 3. 機能の確認

### 3.1 接続テスト

開発サーバーを起動後、以下のエンドポイントで接続をテストできます：

```
GET /api/debug/chime-test
```

### 3.2 音声通話の使用方法

1. チャットルームにアクセス
2. ヘッダーの電話アイコンをクリック
3. 「通話開始」ボタンをクリック
4. ブラウザのマイク権限を許可
5. 通話が開始されます

## 4. 機能詳細

### 4.1 実装された機能

- ✅ 音声のみのグループ通話
- ✅ ミュート/スピーカー切り替え
- ✅ 参加者リスト表示
- ✅ 発話インジケーター
- ✅ エコーキャンセル
- ✅ ノイズサプレッション
- ✅ 自動ゲインコントロール
- ✅ 再接続処理
- ✅ エラーハンドリング

### 4.2 APIエンドポイント

- `POST /api/meetings` - 会議の作成
- `DELETE /api/meetings` - 会議の削除
- `POST /api/attendees` - 参加者の作成
- `DELETE /api/attendees` - 参加者の削除

### 4.3 コンポーネント

- `VoiceCallComponent` - メインの音声通話UI
- `TestVoiceCallComponent` - テスト用のモック実装

## 5. トラブルシューティング

### 5.1 よくある問題

**Q: マイク権限が取得できない**
A: HTTPS環境で実行されていることを確認してください。ローカル開発の場合は`localhost`でも動作します。

**Q: 音声が聞こえない**
A: ブラウザの音声出力設定を確認してください。また、スピーカーボタンが有効になっているか確認してください。

**Q: AWS認証エラー**
A: 環境変数の設定とIAM権限を確認してください。

### 5.2 デバッグ方法

1. ブラウザの開発者ツールでコンソールログを確認
2. `/api/debug/chime-test`エンドポイントで接続テスト
3. AWS CloudWatchでログを確認

## 6. セキュリティ考慮事項

- 認証済みユーザーのみが通話に参加可能
- 各チャットルームごとに独立した会議を作成
- 会議終了時に自動的にリソースをクリーンアップ

## 7. パフォーマンス最適化

- DTX（Discontinuous Transmission）を有効化
- エコーキャンセルとノイズサプレッションを有効化
- 音声のみの設定で帯域幅を最適化

## 8. 今後の拡張予定

- 録音機能
- 通話履歴
- プッシュ通知
- より詳細な参加者管理
