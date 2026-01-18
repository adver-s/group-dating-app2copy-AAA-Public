"use client";

import { AnimatePresence, motion as motionAny } from 'framer-motion';
import React, { useEffect, useState } from 'react';
const MotionDiv: any = (motionAny as any).div;

interface AdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 広告画像の配列（元の3枚の画像）
const adImages = [
  {
    id: 1,
    type: 'svg',
    content: (
      <div className="w-full min-h-64 bg-white border-4 border-black p-6 flex flex-col items-center justify-center text-black">
        <h2 className="text-xl font-bold mb-4 text-center">一緒にadver-sを<br />創ってくれる方を<br />募集!!</h2>
        <p className="text-sm mb-2 text-center">現役大学生のみで作られた</p>
        <p className="text-sm mb-2 text-center">たった4人の平均年齢21歳の</p>
        <p className="text-sm mb-4 text-center">チームです</p>
        <div className="text-sm mb-4">
          <p>• 大学生の方</p>
          <p>• 社会人の方</p>
          <p>• 投資方の方</p>
          <p>• adver-sを応援してくれる方</p>
        </div>
        <p className="text-sm mb-4 text-center">どんな方でも<br />お気軽に絡んできてください!</p>
        <div className="text-xs">
          <p>adver-sホームページ</p>
          <p>https://sites.google.com/view/adver-s/</p>
          <p className="mt-2">adver-s公式SNS</p>
          <p>X: @advers1gather</p>
        </div>
      </div>
    ),
    alt: 'adver-s募集広告'
  },
  {
    id: 2,
    type: 'svg',
    content: (
      <div className="w-full min-h-64 bg-white border-4 border-black p-6 flex flex-col items-center justify-center text-black">
        <h2 className="text-lg font-bold mb-2 text-left w-full">Gather-sを使ってくれてありがとう!</h2>
        <div className="text-right w-full mb-4">
          <p className="text-lg font-bold">みんなの意見を教えて!</p>
        </div>
        <div className="text-sm text-left w-full">
          <p>現役大学生で頑張って作った</p>
          <p>アプリなので多分色々がばいです..</p>
          <p className="mt-2">どうかエラーや意見あったら</p>
          <p>遠慮なくください!!</p>
          <p>応援コメも待ってます!</p>
          <p className="text-xs mt-2">※アンチコメは泣いちゃう</p>
        </div>
        <div className="mt-4 text-xs text-center">
          <p>adver-s</p>
        </div>
      </div>
    ),
    alt: 'Gather-sフィードバック募集'
  },
  {
    id: 3,
    type: 'svg',
    content: (
      <div className="w-full min-h-64 bg-white border-4 border-black p-6 flex flex-col items-center justify-center text-black">
        <h1 className="text-2xl font-bold mb-1">Gather-s</h1>
        <h2 className="text-lg font-bold mb-3">ようこそ!</h2>
        <div className="text-sm text-left w-full">
          <p className="mb-2">
            <span className="text-2xl">マ</span>ッチングアプリ大好きな現役大学生が約半年かけて
          </p>
          <p className="mb-2">マッチングアプリ使いたいけど一人で使うのは怖いよ~</p>
          <p className="mb-2">という思いから、合コンや2対2や3対3で出会える</p>
          <p className="mb-2">アプリがあればいいのに!! ...と個人的な欲望からスタートしました</p>
          <p className="mb-2">Gather-sですが、いろんな方の協力もあってなんとか正式リリースまで</p>
          <p className="mb-3">漕ぎ着けました..!</p>
          <p className="mb-2">手作り感満載のアプリなのでエラーとか起きちゃうかもだけど、</p>
          <p>真心込めて作ったマッチングアプリなので優しく扱ってね!</p>
        </div>
        <div className="mt-3 text-xs text-center">
          <p>adver-s</p>
        </div>
      </div>
    ),
    alt: 'Gather-sようこそ'
  }
];

export default function AdModal({ isOpen, onClose }: AdModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // モーダルが開かれた時にランダムな画像を選択
  useEffect(() => {
    if (isOpen) {
      const randomIndex = Math.floor(Math.random() * adImages.length);
      setCurrentImageIndex(randomIndex);
    }
  }, [isOpen]);

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // スクロールを無効化
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // スクロールを再有効化
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // モーダル外クリックで閉じる
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleBackdropClick}
        >
          <MotionDiv
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-lg shadow-2xl max-w-sm w-full mx-4 max-h-[85vh] overflow-y-auto"
          >
            {/* 閉じるボタン */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 z-10 w-8 h-8 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200 shadow-md"
              aria-label="モーダルを閉じる"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* 画像コンテナ */}
            <div className="relative w-full h-full">
              <div className="w-full">
                {adImages[currentImageIndex].content}
              </div>
            </div>
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
}
