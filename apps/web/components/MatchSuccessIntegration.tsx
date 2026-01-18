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

// 既存のマッチング処理に統合する例
export function MatchSuccessIntegration() {
  const [matchSuccessData, setMatchSuccessData] = useState<MatchSuccessPayload | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const { getAccessToken } = useAuth();

  // マッチング成立時のハンドラ
  const handleMatchSuccess = (payload: MatchSuccessPayload) => {
    setMatchSuccessData(payload);
    setShowMatchModal(true);
  };

  // 実際のマッチング承諾処理（既存のコードに統合）
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
        
        // チーム画像を取得（実際のAPIから）
        const myTeamImageUrl = await getTeamImageUrl(result.data.fromTeamId);
        const otherTeamImageUrl = await getTeamImageUrl(result.data.toTeamId);
        
        // マッチング成立時にモーダルを表示
        handleMatchSuccess({
          myTeamImageUrl,
          otherTeamImageUrl,
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

  // チーム画像を取得する関数（実際のAPIから）
  const getTeamImageUrl = async (teamId: string): Promise<string> => {
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`/api/teams/${teamId}/image`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.imageUrl;
      }
    } catch (error) {
      console.error('チーム画像取得エラー:', error);
    }
    
    // フォールバック画像
    return "https://picsum.photos/300/400?random=" + Math.random();
  };

  // マッチング成立時の処理（既存のコードに統合する例）
  const handleMatchEstablished = async (matchingFlowId: string) => {
    try {
      // マッチング成立の確認
      const accessToken = getAccessToken();
      const response = await fetch(`/api/matches/${matchingFlowId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

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

  return (
    <>
      {/* 既存のマッチング処理コンポーネント */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">マッチング処理統合例</h2>
        
        {/* テスト用ボタン */}
        <button
          onClick={() => handleMatchConfirmation("test-matching-flow-id")}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mb-4"
        >
          マッチング承諾テスト
        </button>

        <button
          onClick={() => handleMatchEstablished("test-matching-flow-id")}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 mb-4 ml-2"
        >
          マッチング成立確認テスト
        </button>

        {/* デバッグ情報 */}
        {matchSuccessData && (
          <div className="mt-4 p-4 bg-gray-200 rounded">
            <h3 className="font-bold mb-2">マッチング成立データ:</h3>
            <p>自分のチーム画像: {matchSuccessData.myTeamImageUrl}</p>
            <p>相手チーム画像: {matchSuccessData.otherTeamImageUrl}</p>
            <p>チャットルームID: {matchSuccessData.chatRoomId}</p>
            <p>マッチID: {matchSuccessData.matchId}</p>
            <p>チーム名: {matchSuccessData.teamNames}</p>
          </div>
        )}
      </div>

      {/* マッチ成功モーダル */}
      <MatchSuccessModal
        open={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        myTeamImageUrl={matchSuccessData?.myTeamImageUrl || ""}
        otherTeamImageUrl={matchSuccessData?.otherTeamImageUrl || ""}
        chatRoomId={matchSuccessData?.chatRoomId || ""}
        // ルートが特殊な場合はここで上書き
        // buildChatPath={(id) => `/dm/rooms/${id}`}
      />
    </>
  );
}
