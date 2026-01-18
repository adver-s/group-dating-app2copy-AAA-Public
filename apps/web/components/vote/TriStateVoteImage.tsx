"use client"

import React, { useState, useEffect } from 'react';

export type VoteStatus = "UNSET" | "YES" | "NO";

interface TriStateVoteImageProps {
  size?: number;
  ariaLabelBase?: string;
  persistKey?: string;
  onChange?: (status: VoteStatus) => void;
  initialStatus?: VoteStatus;
}

export const TriStateVoteImage: React.FC<TriStateVoteImageProps> = ({
  size = 48,
  ariaLabelBase = "投票",
  persistKey,
  onChange,
  initialStatus = "UNSET"
}) => {
  const [status, setStatus] = useState<VoteStatus>(initialStatus);

  // ローカルストレージから状態を復元
  useEffect(() => {
    if (persistKey) {
      const saved = localStorage.getItem(persistKey);
      if (saved && (saved === "UNSET" || saved === "YES" || saved === "NO")) {
        setStatus(saved as VoteStatus);
      }
    }
  }, [persistKey]);

  // 状態を保存
  useEffect(() => {
    if (persistKey) {
      localStorage.setItem(persistKey, status);
    }
  }, [status, persistKey]);

  const handleClick = () => {
    let newStatus: VoteStatus;
    switch (status) {
      case "UNSET":
        newStatus = "YES";
        break;
      case "YES":
        newStatus = "NO";
        break;
      case "NO":
        newStatus = "UNSET";
        break;
      default:
        newStatus = "UNSET";
    }
    
    setStatus(newStatus);
    onChange?.(newStatus);
  };

  const getVoteContent = () => {
    switch (status) {
      case "YES":
        return (
          <div className="w-full h-full bg-amber-50 border-2 border-green-500 rounded-full flex items-center justify-center p-1">
            {/* Aliceキャラクター - あり */}
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* 髪 */}
              <path d="M30 25 Q50 15 70 25 Q75 35 70 45 Q65 50 60 45 Q55 40 50 35 Q45 40 40 45 Q35 50 30 45 Q25 35 30 25" fill="#FFD700" stroke="#8B4513" strokeWidth="1"/>
              {/* 顔 */}
              <circle cx="50" cy="50" r="15" fill="#FFE4C4" stroke="#8B4513" strokeWidth="1"/>
              {/* 目 */}
              <circle cx="45" cy="47" r="2" fill="#000"/>
              <circle cx="55" cy="47" r="2" fill="#000"/>
              {/* 口 */}
              <path d="M45 55 Q50 58 55 55" fill="none" stroke="#FF69B4" strokeWidth="1"/>
              {/* ドレス */}
              <path d="M35 65 L65 65 L60 85 L40 85 Z" fill="#87CEEB" stroke="#4682B4" strokeWidth="1"/>
              {/* 白い丸のサイン */}
              <circle cx="75" cy="30" r="8" fill="white" stroke="#FF0000" strokeWidth="2"/>
              <circle cx="75" cy="30" r="4" fill="#FF0000"/>
            </svg>
          </div>
        );
      case "NO":
        return (
          <div className="w-full h-full bg-amber-50 border-2 border-red-500 rounded-full flex items-center justify-center p-1">
            {/* ウサギキャラクター - なし */}
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* 耳 */}
              <ellipse cx="40" cy="25" rx="8" ry="15" fill="white" stroke="#8B4513" strokeWidth="1"/>
              <ellipse cx="60" cy="25" rx="8" ry="15" fill="white" stroke="#8B4513" strokeWidth="1"/>
              {/* 耳の内側 */}
              <ellipse cx="40" cy="25" rx="4" ry="8" fill="#FFB6C1"/>
              <ellipse cx="60" cy="25" rx="4" ry="8" fill="#FFB6C1"/>
              {/* 顔 */}
              <circle cx="50" cy="50" r="15" fill="white" stroke="#8B4513" strokeWidth="1"/>
              {/* 目 */}
              <circle cx="45" cy="47" r="2" fill="#000"/>
              <circle cx="55" cy="47" r="2" fill="#000"/>
              {/* 鼻 */}
              <circle cx="50" cy="52" r="1" fill="#8B4513"/>
              {/* 口（下向き） */}
              <path d="M45 58 Q50 55 55 58" fill="none" stroke="#8B4513" strokeWidth="1"/>
              {/* ジャケット */}
              <path d="M35 65 L65 65 L60 85 L40 85 Z" fill="#8B4513" stroke="#654321" strokeWidth="1"/>
              {/* 腕をクロス */}
              <path d="M35 70 L45 60" stroke="#8B4513" strokeWidth="3" fill="none"/>
              <path d="M55 60 L65 70" stroke="#8B4513" strokeWidth="3" fill="none"/>
              {/* 赤いバツのサイン */}
              <circle cx="75" cy="30" r="8" fill="white" stroke="#FF0000" strokeWidth="2"/>
              <path d="M71 26 L79 34 M79 26 L71 34" stroke="#FF0000" strokeWidth="2" fill="none"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-full h-full bg-white border-2 border-gray-300 rounded-full flex items-center justify-center p-1">
            {/* 帽子をかぶった男性キャラクター - 未設定 */}
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* 帽子 */}
              <ellipse cx="50" cy="25" rx="12" ry="6" fill="#556B2F" stroke="#2F4F2F" strokeWidth="1"/>
              <rect x="38" y="25" width="24" height="8" fill="#556B2F" stroke="#2F4F2F" strokeWidth="1"/>
              {/* 髪 */}
              <path d="M35 35 Q50 30 65 35 Q60 40 55 38 Q50 35 45 38 Q40 40 35 35" fill="#8B4513" stroke="#654321" strokeWidth="1"/>
              {/* 顔 */}
              <circle cx="50" cy="50" r="12" fill="#FFE4C4" stroke="#8B4513" strokeWidth="1"/>
              {/* 目 */}
              <circle cx="47" cy="47" r="1.5" fill="#000"/>
              <circle cx="53" cy="47" r="1.5" fill="#000"/>
              {/* 眉毛（下向き） */}
              <path d="M45 44 Q47 42 49 44" fill="none" stroke="#8B4513" strokeWidth="1"/>
              <path d="M51 44 Q53 42 55 44" fill="none" stroke="#8B4513" strokeWidth="1"/>
              {/* 鼻 */}
              <path d="M48 50 Q50 52 52 50" fill="none" stroke="#8B4513" strokeWidth="1"/>
              {/* 口（下向き） */}
              <path d="M47 55 Q50 53 53 55" fill="none" stroke="#8B4513" strokeWidth="1"/>
              {/* ジャケット */}
              <path d="M35 62 L65 62 L60 85 L40 85 Z" fill="#8B4513" stroke="#654321" strokeWidth="1"/>
              {/* 考え中のポーズ（手を顎に） */}
              <circle cx="65" cy="45" r="3" fill="#FFE4C4" stroke="#8B4513" strokeWidth="1"/>
              <path d="M62 45 L65 42" stroke="#8B4513" strokeWidth="1" fill="none"/>
            </svg>
          </div>
        );
    }
  };

  const getAriaLabel = () => {
    switch (status) {
      case "YES":
        return `${ariaLabelBase} - いいね`;
      case "NO":
        return `${ariaLabelBase} - なし`;
      default:
        return `${ariaLabelBase} - 未設定`;
    }
  };

  return (
    <button
      onClick={handleClick}
      className="transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
      aria-label={getAriaLabel()}
      style={{ width: size, height: size }}
    >
      {getVoteContent()}
    </button>
  );
};
