# MatchSuccessModal 使用方法

## 概要

`MatchSuccessModal`は、マッチング成立時に表示されるポップアップモーダルコンポーネントです。提供された背景画像を使用し、左右に各チームの画像をカード風に表示します。

## 機能

- マッチング成立時の祝賀表示
- 左右に各チームの画像をカード風に合成表示
- 「チャットを開始」ボタンでチャットルームへ遷移
- 画面外クリック/ESCキーで閉じる
- モバイル対応（9:16アスペクト比ベース）

## 必要なファイル

### 1. 背景画像
```
/public/advers/match_success.png
```

### 2. コンポーネント
```
/components/MatchSuccessModal.tsx
```

## Props

| プロパティ | 型 | 必須 | 説明 |
|-----------|----|------|------|
| `open` | `boolean` | ✅ | モーダルの表示状態 |
| `onClose` | `() => void` | ✅ | モーダルを閉じる関数 |
| `myTeamImageUrl` | `string` | ✅ | 自分のチーム画像URL |
| `otherTeamImageUrl` | `string` | ✅ | 相手チーム画像URL |
| `chatRoomId` | `string` | ✅ | チャットルームID |
| `buildChatPath` | `(roomId: string) => string` | ❌ | カスタムチャットパス生成関数 |

## 基本的な使用方法

```tsx
import MatchSuccessModal from "@/components/MatchSuccessModal";

function MyComponent() {
  const [showModal, setShowModal] = useState(false);
  const [matchData, setMatchData] = useState({
    myTeamImageUrl: "",
    otherTeamImageUrl: "",
    chatRoomId: ""
  });

  const handleMatchSuccess = (payload: {
    myTeamImageUrl: string;
    otherTeamImageUrl: string;
    chatRoomId: string;
  }) => {
    setMatchData(payload);
    setShowModal(true);
  };

  return (
    <>
      {/* 既存のコンポーネント */}
      
      <MatchSuccessModal
        open={showModal}
        onClose={() => setShowModal(false)}
        myTeamImageUrl={matchData.myTeamImageUrl}
        otherTeamImageUrl={matchData.otherTeamImageUrl}
        chatRoomId={matchData.chatRoomId}
      />
    </>
  );
}
```

## 実際のマッチング処理での統合例

### 1. マッチング承諾時の処理

```tsx
const handleMatchConfirmation = async (matchingFlowId: string) => {
  try {
    const response = await fetch(`/api/matches/${matchingFlowId}/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      
      // チーム画像を取得
      const myTeamImageUrl = await getTeamImageUrl(result.data.fromTeamId);
      const otherTeamImageUrl = await getTeamImageUrl(result.data.toTeamId);
      
      // マッチング成立モーダルを表示
      handleMatchSuccess({
        myTeamImageUrl,
        otherTeamImageUrl,
        chatRoomId: result.data.chatRoomId,
        matchId: result.data.matchId,
        teamNames: result.data.teamNames
      });
    }
  } catch (error) {
    console.error('マッチング承諾エラー:', error);
  }
};
```

### 2. マッチング成立確認時の処理

```tsx
const handleMatchEstablished = async (matchingFlowId: string) => {
  try {
    const response = await fetch(`/api/matches/${matchingFlowId}`);
    
    if (response.ok) {
      const matchData = await response.json();
      
      if (matchData.status === 'confirmed') {
        // チーム画像を取得
        const myTeamImageUrl = await getTeamImageUrl(matchData.teams[0]);
        const otherTeamImageUrl = await getTeamImageUrl(matchData.teams[1]);
        
        // チャットルームIDを取得または作成
        const chatRoomId = `chat_${matchingFlowId}`;
        
        // マッチング成立モーダルを表示
        handleMatchSuccess({
          myTeamImageUrl,
          otherTeamImageUrl,
          chatRoomId,
          matchId: matchData.id,
          teamNames: matchData.teamName
        });
      }
    }
  } catch (error) {
    console.error('マッチング成立確認エラー:', error);
  }
};
```

## カスタムチャットパスの設定

デフォルトでは `/chat/${chatRoomId}` に遷移しますが、異なるルート構造を使用する場合は `buildChatPath` プロパティで上書きできます：

```tsx
<MatchSuccessModal
  open={showModal}
  onClose={() => setShowModal(false)}
  myTeamImageUrl={myTeamImageUrl}
  otherTeamImageUrl={otherTeamImageUrl}
  chatRoomId={chatRoomId}
  buildChatPath={(roomId) => `/dm/rooms/${roomId}`}
/>
```

## テスト方法

テストページ `/test-match-modal` でモーダルの動作を確認できます：

1. ブラウザで `/test-match-modal` にアクセス
2. 「マッチ成立テスト」ボタンをクリック
3. モーダルが表示されることを確認
4. 「チャットを開始」ボタンでチャットページに遷移することを確認

## 注意事項

- 背景画像 `/public/advers/match_success.png` が存在しない場合、フォールバック背景が表示されます
- チーム画像の読み込みに失敗した場合、プレースホルダー画像が表示されます
- モーダルは z-index: 1000 で表示されるため、他の要素より前面に表示されます
- モバイルデバイスでは 9:16 アスペクト比をベースにレスポンシブ表示されます

## トラブルシューティング

### 背景画像が表示されない
- `/public/advers/match_success.png` が存在することを確認
- 画像ファイルが破損していないことを確認

### チーム画像が表示されない
- 画像URLが有効であることを確認
- CORS設定が適切であることを確認

### チャットページに遷移しない
- `chatRoomId` が正しく設定されていることを確認
- チャットルートが存在することを確認
- `buildChatPath` プロパティが正しく設定されていることを確認
