# 合コン成立モーダル セットアップ

## 概要
予定調整が完了して合コン成立した瞬間に表示されるポップアップモーダルの実装です。

## 実装済み機能
- ✅ モーダル表示（フェードイン/ズームインアニメーション）
- ✅ 日時表示（Noto Sans JPフォント）
- ✅ 「予定を確認」ボタン（合コン会議ページへ遷移）
- ✅ フォーカス機能（該当カードを中央にスクロール＆ハイライト）
- ✅ アクセシビリティ対応（Esc/外側クリックで閉じる）

## セットアップ手順

### 1. 画像ファイルの配置
実際の使用時は、以下の手順で画像を配置してください：

```bash
# public/advers/match_ok.png に実際の画像ファイルを配置
# 「不思議の国のアリス」テーマの合コン成立画像
```

### 2. テスト方法
```bash
# 開発サーバーを起動
npm run dev

# テストページにアクセス
http://localhost:3000/test-modal
```

### 3. 実際の使用例
```typescript
import MatchEstablishedModal from "@/components/MatchEstablishedModal";

// 予定調整成功時に呼び出し
const onScheduleConfirmed = (proposalId: string, startsAtISO: string, place?: string) => {
  const date = new Date(startsAtISO);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const dayName = days[date.getDay()];
  const scheduledText = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}(${dayName}) ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}${place ? `  ${place}` : ""}`;
  
  setModalOpen(true);
  setProposalId(proposalId);
  setScheduledAt(scheduledText);
};
```

## ファイル構成
```
components/
├── MatchEstablishedModal.tsx          # メインモーダルコンポーネント
└── ScheduleConfirmationExample.tsx    # 使用例

app/
├── matches/confirmed/page.tsx         # 合コン会議ページ（フォーカス機能付き）
└── test-modal/page.tsx                # テストページ

public/
└── advers/
    └── match_ok.png                   # 背景画像（要配置）
```

## カスタマイズ

### フォント変更
`components/MatchEstablishedModal.tsx` の以下の部分を編集：
```typescript
style={{ fontFamily: 'var(--font-noto-sans-jp), Noto Sans JP, sans-serif' }}
```

### 日時位置調整
`components/MatchEstablishedModal.tsx` の以下の部分を編集：
```typescript
className="
  absolute left-1/2 -translate-x-1/2
  top-[55%]  // この値を調整
  w-[85%]    // この値を調整
"
```

### アニメーション調整
`app/globals.css` の以下の部分を編集：
```css
.fade-in {
  animation: fade-in 0.2s ease-out;  // 0.2sを調整
}

.zoom-in {
  animation: zoom-in 0.2s ease-out;  // 0.2sを調整
}
```

## トラブルシューティング

### 画像が表示されない
1. 画像ファイルが正しく配置されているか確認
2. ファイル名とパスが正しいか確認
3. ブラウザの開発者ツールでネットワークエラーを確認

### フォントが適用されない
1. `app/layout.tsx` でNoto Sans JPが正しくインポートされているか確認
2. CSS変数が正しく設定されているか確認

### フォーカス機能が動作しない
1. 合コン会議ページのカードに `id="card-<proposalId>"` が設定されているか確認
2. スクロールコンテナのIDが正しいか確認

## 画像について

現在使用している画像は「不思議の国のアリス」テーマの合コン成立画像です：

- **中央**: 光り輝く封筒から「合コン成立！」の文字
- **背景**: チェシャ猫、白ウサギ、ティーカップなどのキャラクター
- **ボタン**: 琥珀色に光る「予定を確認」ボタン
- **効果**: 金色の星や粒子でファンタジックな演出

この画像に合わせて、日時テキストは「合コン成立！」の下に配置され、ボタンは画像の実際のボタン位置に重ねられています。
