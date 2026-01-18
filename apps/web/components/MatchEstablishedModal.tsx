"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  proposalId: string;
  scheduledAt: string; // 表示用にフォーマット済み文字列でもOK
  onClose: () => void;
};

export default function MatchEstablishedModal({
  open,
  proposalId,
  scheduledAt,
  onClose,
}: Props) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const goConfirm = () => {
    // マッチ一覧ページへ遷移（proposalIdをクエリで渡す）
    router.push(`/matches?focus=${encodeURIComponent(proposalId)}`);
    onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="合コン成立のお知らせ"
    >
      <div className="relative w-full max-w-sm md:max-w-md bg-transparent animate-in fade-in zoom-in duration-200">
        {/* 画像（下地） */}
        <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden shadow-xl">
          <Image
            src="/advers/match_success.png"
            alt="合コン成立カード"
            fill
            className="object-cover"
            priority
          />

          {/* 日時テキスト：「合コン成立！」の下に重ねる */}
          <div
            className="
              absolute left-1/2 -translate-x-1/2
              top-[52%]
              w-[80%] text-center
              font-bold text-[15px] md:text-[17px]
              tracking-wide text-amber-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]
            "
            style={{ fontFamily: 'var(--font-noto-sans-jp), Noto Sans JP, sans-serif' }}
          >
            {scheduledAt}
          </div>

          {/* 「予定を確認」クリック可能レイヤー */}
          <button
            onClick={goConfirm}
            aria-label="予定を確認"
            className="
              absolute left-1/2 -translate-x-1/2
              bottom-[24%]
              w-[82%] h-[50px] md:h-[58px]
              rounded-xl
              bg-black/0 hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-amber-300/60
            "
          />
        </div>

        {/* 閉じる(X) */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 bg-white text-black rounded-full w-8 h-8 grid place-items-center shadow-md hover:opacity-90"
          aria-label="閉じる"
        >
          ×
        </button>
      </div>
    </div>
  );
}
