"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";

type Pos = {
  top: string; left?: string; right?: string; width: string; height: string; rotate: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  myTeamImageUrl: string;
  otherTeamImageUrl: string;
  chatRoomId: string;
  buildChatPath?: (roomId: string) => string;

  // 位置の上書き用（必要な場合のみ渡す）
  leftPosMobile?: Partial<Pos>;
  rightPosMobile?: Partial<Pos>;
  leftPosDesktop?: Partial<Pos>;
  rightPosDesktop?: Partial<Pos>;

  debug?: boolean; // 配置枠の可視化
};

const MOBILE_DEFAULT_LEFT: Pos = {
  // 背景の青長方形に合わせたデフォルト値（スマホ）
  top: "30%", left: "12%", width: "28%", height: "22%", rotate: "-10deg",
};
const MOBILE_DEFAULT_RIGHT: Pos = {
  top: "31%", right: "12%", width: "28%", height: "22%", rotate: "10deg",
};

const DESKTOP_DEFAULT_LEFT: Pos = {
  // md以上用（縦横比差分を微調整）
  top: "28%", left: "14%", width: "26%", height: "20%", rotate: "-10deg",
};
const DESKTOP_DEFAULT_RIGHT: Pos = {
  top: "29%", right: "14%", width: "26%", height: "20%", rotate: "10deg",
};

function useVars(m: Pos, d: Pos) {
  // CSS 変数を style に渡す
  return useMemo(() => {
    return {
      // mobile
      ["--leftTop" as any]: m.top,
      ["--leftLeft" as any]: m.left ?? "auto",
      ["--leftRight" as any]: m.right ?? "auto",
      ["--leftW" as any]: m.width,
      ["--leftH" as any]: m.height,
      ["--leftRot" as any]: m.rotate,

      ["--rightTop" as any]: m.top, // 使わないけど md: で上書くのでダミー
      ["--rightLeft" as any]: "auto",
      ["--rightRight" as any]: "12%",
      ["--rightW" as any]: m.width,
      ["--rightH" as any]: m.height,
      ["--rightRot" as any]: "10deg",

      // md以上（後段のクラスで参照）
      ["--leftTopMd" as any]: d.top,
      ["--leftLeftMd" as any]: d.left ?? "auto",
      ["--leftRightMd" as any]: d.right ?? "auto",
      ["--leftWMd" as any]: d.width,
      ["--leftHMd" as any]: d.height,
      ["--leftRotMd" as any]: d.rotate,

      ["--rightTopMd" as any]: d.top,
      ["--rightLeftMd" as any]: "auto",
      ["--rightRightMd" as any]: d.right ?? "14%",
      ["--rightWMd" as any]: d.width,
      ["--rightHMd" as any]: d.height,
      ["--rightRotMd" as any]: d.rotate,
    } as React.CSSProperties;
  }, [m, d]);
}

export default function MatchSuccessModal({
  open,
  onClose,
  myTeamImageUrl,
  otherTeamImageUrl,
  chatRoomId,
  buildChatPath,
  leftPosMobile,
  rightPosMobile,
  leftPosDesktop,
  rightPosDesktop,
  debug = false,
}: Props) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 実際に使う値（上書きが来たらマージ）
  const leftMobile: Pos = { ...MOBILE_DEFAULT_LEFT, ...(leftPosMobile ?? {}) };
  const rightMobile: Pos = { ...MOBILE_DEFAULT_RIGHT, ...(rightPosMobile ?? {}) };
  const leftDesktop: Pos = { ...DESKTOP_DEFAULT_LEFT, ...(leftPosDesktop ?? {}) };
  const rightDesktop: Pos = { ...DESKTOP_DEFAULT_RIGHT, ...(rightPosDesktop ?? {}) };

  const vars = useVars(leftMobile, leftDesktop);

  if (!open) return null;

  const goChat = () => {
    const href = buildChatPath?.(chatRoomId) ?? `/chat/${encodeURIComponent(chatRoomId)}`;
    router.push(href);
    onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="マッチ成立"
    >
      <div className="relative w-full max-w-sm md:max-w-md bg-transparent animate-in fade-in zoom-in duration-200">
        <div
          className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden shadow-xl"
          style={vars}
        >
          <Image
            src="/advers/match_ok.png"
            alt="マッチ成立"
            fill
            className="object-cover"
            priority
          />

          {/* デバッグ用ターゲット枠 */}
          {debug && (
            <>
              <div 
                className="absolute border-2 border-pink-400/70"
                style={{
                  top: "30%",
                  left: "12%",
                  width: "28%",
                  height: "22%",
                  transformOrigin: "bottom center",
                  transform: "rotate(-10deg) skewY(-6deg)"
                }}
              />
              <div 
                className="absolute border-2 border-cyan-400/70"
                style={{
                  top: "31%",
                  right: "12%",
                  width: "28%",
                  height: "22%",
                  transformOrigin: "bottom center",
                  transform: "rotate(10deg) skewY(6deg)"
                }}
              />
            </>
          )}

          {/* 左カード */}
          <div
            className={`
              absolute rounded-xl bg-white overflow-hidden
              shadow-[0_8px_24px_rgba(0,0,0,0.35)] border-4 border-white
              ${debug ? "outline outline-2 outline-fuchsia-400" : ""}
            `}
            style={{
              // ▼位置（まずはこれで試して、1〜2%ずつ微調整）
              top: "30%",       // 旧:40% → かなり上へ
              left: "12%",      // 旧:14%
              width: "28%",     // 旧:32%
              height: "22%",    // 旧:28%
              // ▼台形補正
              transformOrigin: "bottom center",
              transform: "rotate(-10deg) skewY(-6deg)",
            }}
          >
            <Image src={myTeamImageUrl} alt="自分チーム" fill className="object-cover" priority />
          </div>

          {/* 右カード */}
          <div
            className={`
              absolute rounded-xl bg-white overflow-hidden
              shadow-[0_8px_24px_rgba(0,0,0,0.35)] border-4 border-white
              ${debug ? "outline outline-2 outline-cyan-400" : ""}
            `}
            style={{
              top: "31%",       // 旧:41%
              right: "12%",     // 旧:14%
              width: "28%",     // 旧:32%
              height: "22%",    // 旧:28%
              transformOrigin: "bottom center",
              transform: "rotate(10deg) skewY(6deg)",
            }}
          >
            <Image src={otherTeamImageUrl} alt="相手チーム" fill className="object-cover" priority />
          </div>

          {/* クリック可能領域（チャット開始ボタン） */}
          <button
            onClick={goChat}
            aria-label="チャットを開始"
            className="absolute left-1/2 -translate-x-1/2 bottom-[10%] w-[78%] h-[56px] md:h-[64px] rounded-full bg-black/0 hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-rose-300/60"
          />
        </div>

        {/* 閉じる */}
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
