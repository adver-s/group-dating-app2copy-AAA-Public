# コンポーネント構造

このディレクトリには、アプリケーションで使用されるすべてのReactコンポーネントが含まれています。

## ディレクトリ構造

```
components/
├── ui/                    # 基本的なUIコンポーネント
│   ├── chat/             # チャット関連コンポーネント
│   ├── meeting/          # ミーティング関連コンポーネント
│   ├── voice-call/       # 音声通話関連コンポーネント
│   └── wonderland/       # ワンダーランド機能関連
├── features/             # 機能別コンポーネント
├── layouts/              # レイアウトコンポーネント
├── vote/                 # 投票関連コンポーネント
└── [その他のコンポーネント]
```

## コンポーネント分類

### UI コンポーネント (`ui/`)
基本的なUI要素や、特定の機能領域に特化したコンポーネント

#### チャット関連 (`ui/chat/`)
- `ChatBubble.tsx`: チャットメッセージの表示
- `ChatComposer.tsx`: メッセージ入力エリア
- `ChatHeader.tsx`: チャットヘッダー
- `ChatProgressBar.tsx`: 進捗表示
- `SystemMessage.tsx`: システムメッセージ
- `BgSilhouette.tsx`: 背景シルエット

#### ミーティング関連 (`ui/meeting/`)
- `BgSilhouette.tsx`: 背景シルエット

#### 音声通話関連 (`ui/voice-call/`)
- `VoiceCallComponent.tsx`: 音声通話メインコンポーネント
- `TestVoiceCallComponent.tsx`: テスト用コンポーネント
- `index.ts`: エクスポート管理

#### ワンダーランド機能 (`ui/wonderland/`)
- `WonderlandMatchCard.tsx`: マッチカード
- `WonderlandMatchHeader.tsx`: マッチヘッダー
- `WonderlandMatchStats.tsx`: マッチ統計
- `WonderlandSectionHeader.tsx`: セクションヘッダー

### 機能別コンポーネント (`features/`)
特定の機能に特化したコンポーネント

### レイアウトコンポーネント (`layouts/`)
ページレイアウトやナビゲーション関連

### 投票関連 (`vote/`)
- `TriStateVoteImage.tsx`: 三択投票用画像コンポーネント

## 主要コンポーネント

### 共通コンポーネント
- `Icon.tsx`: アイコン表示コンポーネント
- `Modal.tsx`: モーダルダイアログ
- `ErrorBoundary.tsx`: エラーハンドリング
- `FooterNav.tsx`: フッターナビゲーション

### チーム関連
- `TeamCard.tsx`: チームカード表示
- `SwipeableGroupCard.tsx`: スワイプ可能なチームカード
- `TeamImageSwiper.tsx`: チーム画像スライダー
- `TeamChatButton.tsx`: チームチャットボタン

### マッチング関連
- `SwipeCard.tsx`: スワイプカード
- `JudgementCard.tsx`: 判定カード
- `MatchingFlowCard.tsx`: マッチングフローカード
- `MatchSuccessModal.tsx`: マッチ成功モーダル

### その他
- `AdModal.tsx`: 広告モーダル
- `AgeVerificationGuard.tsx`: 年齢認証ガード
- `BackgroundAnimation.tsx`: 背景アニメーション
- `ImageSlider.tsx`: 画像スライダー
- `ExpandableText.tsx`: 展開可能テキスト

## コンポーネント作成ガイドライン

### 1. 命名規則
- コンポーネント名は PascalCase を使用
- ファイル名はコンポーネント名と同じにする
- 機能を表す明確な名前を付ける

### 2. 型定義
- すべての props に型を定義する
- `any` 型は避け、適切な型を定義する
- インターフェース名は `ComponentNameProps` の形式にする

### 3. 構造
```typescript
interface ComponentProps {
  // props の定義
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // コンポーネントの実装
  return (
    // JSX
  )
}

export default Component
```

### 4. スタイリング
- Tailwind CSS を使用
- レスポンシブデザインを考慮
- 一貫性のあるデザインシステムを維持

### 5. アクセシビリティ
- 適切な ARIA 属性を設定
- キーボードナビゲーションをサポート
- スクリーンリーダーに対応

## 使用例

### 基本的なコンポーネントの使用
```typescript
import Icon from '@/components/Icon'
import Modal from '@/components/Modal'

// アイコンの使用
<Icon name="heart" className="w-5 h-5 text-red-500" />

// モーダルの使用
<Modal 
  isOpen={isModalOpen} 
  onClose={() => setIsModalOpen(false)} 
  type="welcome" 
/>
```

### チャットコンポーネントの使用
```typescript
import ChatComposer from '@/components/ui/chat/ChatComposer'

<ChatComposer
  newMessage={message}
  onNewMessageChange={setMessage}
  onSendMessage={handleSendMessage}
  onMeetIntent={handleMeetIntent}
  hasExpressedIntent={hasIntent}
  isScheduleUnlocked={isUnlocked}
  onScheduleMeeting={handleSchedule}
/>
```
