# スワイプ機能実装

## 概要

グループ一覧ページで待機中のグループをスワイプまたは長押ししてアクティブグループに切り替える機能を実装しました。

## 機能詳細

### 1. スワイプ機能
- **対象**: 待機中のグループのみ
- **操作方法**: 右にスワイプ（80px以上）
- **視覚的フィードバック**: 
  - スワイプ中に背景色が変化（グレー → 黄色 → 緑）
  - カードが少し縮小・回転
  - 右端に「アクティブ化」インジケーターが表示

### 2. 長押し機能
- **対象**: 待機中のグループのみ
- **操作方法**: 600ms長押し
- **視覚的フィードバック**: カードが少し縮小

### 3. 確認モーダル
- スワイプまたは長押し後に確認モーダルが表示
- 「はい」を押すとアクティブグループに切り替え
- 「キャンセル」で操作をキャンセル

## 実装されたファイル

### 1. メインコンポーネント
- `components/SwipeableGroupCard.tsx` - スワイプ・長押し機能付きカードコンポーネント

### 2. ページ統合
- `app/teams/page.tsx` - グループ一覧ページ（更新）

### 3. テストページ
- `app/test-swipe/page.tsx` - スワイプ機能のテストページ

## 技術仕様

### 使用ライブラリ
- **Framer Motion**: アニメーションとドラッグ機能
- **React**: 状態管理とイベント処理

### 主要な機能

#### スワイプ検出
```typescript
const handleDragEnd = async (event: any, info: PanInfo) => {
  if (group.status === 'waiting' && info.offset.x > 80) {
    setShowConfirmModal(true)
  }
  x.set(0) // 位置をリセット
}
```

#### 長押し検出
```typescript
const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
  if (group.status === 'waiting' && !isDragging) {
    const timer = setTimeout(() => {
      setIsLongPressing(true)
      setShowConfirmModal(true)
    }, 600)
    setLongPressTimer(timer)
  }
}
```

#### 視覚的フィードバック
```typescript
const background = useTransform(x, xInput, [
  "linear-gradient(90deg, #f3f4f6 0%, #f3f4f6 100%)", // 通常
  "linear-gradient(90deg, #fef3c7 0%, #fef3c7 100%)", // 警告
  "linear-gradient(90deg, #10b981 0%, #10b981 100%)", // 成功
  "linear-gradient(90deg, #059669 0%, #059669 100%)"  // 確定
])
```

## 使用方法

### 1. 基本的な使用
```typescript
import SwipeableGroupCard from '@/components/SwipeableGroupCard'

<SwipeableGroupCard
  group={group}
  onToggleActive={handleToggleActive}
  onNavigateToDetail={handleNavigateToDetail}
  getGroupIllustration={getGroupIllustration}
  isToggling={isToggling}
/>
```

### 2. 必要なprops
- `group`: グループ情報（id, name, description, status）
- `onToggleActive`: アクティブ化処理の関数
- `onNavigateToDetail`: 詳細ページ遷移の関数
- `getGroupIllustration`: グループのイラストを返す関数
- `isToggling`: 処理中かどうかのフラグ

### 3. グループ状態
```typescript
interface Group {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'waiting';
}
```

## ユーザー体験

### 1. 視覚的ガイド
- 待機グループには「長押しまたはスワイプでアクティブ化」のヒントを表示
- スワイプ中にリアルタイムで背景色が変化
- 右端にアクティブ化インジケーターが表示

### 2. 操作感
- スムーズなアニメーション
- 適切なドラッグ制約（左右のみ）
- 長押しとスワイプの競合を回避

### 3. 確認プロセス
- 操作後に必ず確認モーダルを表示
- 処理中の状態表示
- エラーハンドリング

## テスト方法

### 1. テストページへのアクセス
```
http://localhost:3000/test-swipe
```

### 2. テスト項目
- [ ] 待機グループの右スワイプ
- [ ] 待機グループの長押し
- [ ] アクティブグループの通常表示
- [ ] 確認モーダルの表示・非表示
- [ ] 処理中の状態表示
- [ ] エラー時の動作

### 3. デバイステスト
- [ ] スマートフォン（タッチ操作）
- [ ] タブレット（タッチ操作）
- [ ] デスクトップ（マウス操作）

## 制約と制限

### 1. 対象グループ
- 待機中のグループのみがスワイプ・長押し可能
- アクティブグループは通常のカードとして表示

### 2. 操作制限
- 左右のスワイプのみ対応（上下は無効）
- 80px以上のスワイプでアクティブ化
- 600ms以上の長押しでアクティブ化

### 3. 同時操作
- 長押しとスワイプの同時実行は防止
- 処理中の重複操作は防止

## 今後の改善点

### 1. アクセシビリティ
- キーボード操作のサポート
- スクリーンリーダー対応
- 高コントラストモード対応

### 2. パフォーマンス
- 大量のグループがある場合の最適化
- メモリ使用量の最適化

### 3. 機能拡張
- 左スワイプでの削除機能
- スワイプ距離による異なるアクション
- カスタムアニメーション

## トラブルシューティング

### 1. よくある問題
- **スワイプが反応しない**: 待機グループかどうか確認
- **長押しが動作しない**: タッチイベントの設定確認
- **アニメーションが重い**: デバイスの性能確認

### 2. デバッグ方法
- ブラウザの開発者ツールでコンソールログ確認
- ネットワークタブでAPI通信確認
- デバイスエミュレーションでタッチ操作テスト

## 注意事項

- モバイルデバイスでのテストを推奨
- タッチイベントとマウスイベントの両方に対応
- 処理中の重複操作を防ぐ仕組みを実装
- ユーザビリティを考慮した適切なタイミング設定
