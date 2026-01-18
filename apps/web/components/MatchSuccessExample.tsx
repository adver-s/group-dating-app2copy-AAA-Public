"use client";
import { useState, useEffect } from "react";
import MatchSuccessModal from "./MatchSuccessModal";
import { useAuth } from "../contexts/AuthContext";

// マッチング成立時のペイロード型
interface MatchSuccessPayload {
  myTeamImageUrl: string;
  otherTeamImageUrl: string;
  chatRoomId: string;
  matchId: string;
  teamNames: string;
}

export function MatchSuccessExample() {
  const [open, setOpen] = useState(false);
  const [matchData, setMatchData] = useState<MatchSuccessPayload | null>(null);
  const { getAccessToken } = useAuth();

  // マッチング成立時のハンドラ
  const onMatched = (payload: MatchSuccessPayload) => {
    setMatchData(payload);
    setOpen(true);
  };

  // 実際のマッチング成立処理の例
  const handleMatchConfirmation = async (matchingFlowId: string) => {
    try {
      const accessToken = getAccessToken();
      
      // マッチング承諾APIを呼び出し
      const response = await fetch(`/api/matches/${matchingFlowId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ マッチング成立:', result);
        
        // マッチング成立時にモーダルを表示
        onMatched({
          myTeamImageUrl: "https://picsum.photos/300/400?random=1", // 実際のAPIから取得
          otherTeamImageUrl: "https://picsum.photos/300/400?random=2", // 実際のAPIから取得
          chatRoomId: result.data.chatRoomId,
          matchId: result.data.matchId,
          teamNames: result.data.teamNames
        });
      } else {
        const errorData = await response.json();
        console.error('❌ マッチング承諾エラー:', errorData);
        alert(`エラー: ${errorData.error || 'マッチング承諾に失敗しました'}`);
      }
    } catch (error) {
      console.error('❌ マッチング承諾エラー:', error);
      alert('マッチング承諾に失敗しました');
    }
  };

  // テスト用のボタン（実際の使用時は削除）
  const handleTestMatch = () => {
    onMatched({
      myTeamImageUrl: "https://picsum.photos/300/400?random=1",
      otherTeamImageUrl: "https://picsum.photos/300/400?random=2",
      chatRoomId: "test-room-123",
      matchId: "test-match-456",
      teamNames: "チームA × チームB"
    });
  };

  return (
    <div className="p-4">
      {/* テスト用ボタン */}
      <button
        onClick={handleTestMatch}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mb-4"
      >
        マッチ成立テスト
      </button>

      {/* 実際のマッチング承諾ボタンの例 */}
      <button
        onClick={() => handleMatchConfirmation("test-matching-flow-id")}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 mb-4 ml-2"
      >
        マッチング承諾テスト
      </button>

      {/* デバッグ情報 */}
      <div className="mt-4 p-4 bg-gray-200 rounded">
        <h3 className="font-bold mb-2">デバッグ情報:</h3>
        <p>背景画像パス: /advers/match_success.png</p>
        <p>モーダル状態: {open ? "開いている" : "閉じている"}</p>
        {matchData && (
          <>
            <p>自分のチーム画像: {matchData.myTeamImageUrl}</p>
            <p>相手チーム画像: {matchData.otherTeamImageUrl}</p>
            <p>チャットルームID: {matchData.chatRoomId}</p>
            <p>マッチID: {matchData.matchId}</p>
            <p>チーム名: {matchData.teamNames}</p>
          </>
        )}
      </div>

      <MatchSuccessModal
        open={open}
        onClose={() => setOpen(false)}
        myTeamImageUrl={matchData?.myTeamImageUrl || ""}
        otherTeamImageUrl={matchData?.otherTeamImageUrl || ""}
        chatRoomId={matchData?.chatRoomId || ""}
        // ルートが特殊な場合はここで上書き
        // buildChatPath={(id) => `/dm/rooms/${id}`}
      />
    </div>
  );
}
