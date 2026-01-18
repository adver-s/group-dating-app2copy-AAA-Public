'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TestVoiceCallComponentProps {
  roomId: string;
  externalUserId: string;
  onCallEnd?: () => void;
}

interface Attendee {
  attendeeId: string;
  externalUserId: string;
  name?: string;
  isSpeaking?: boolean;
}

const TestVoiceCallComponent: React.FC<TestVoiceCallComponentProps> = ({
  roomId,
  externalUserId,
  onCallEnd,
}) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [attendeeId, setAttendeeId] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // モック会議を作成・参加
  const joinMeeting = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // テスト用会議を作成
      const response = await fetch('/api/test-meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          externalUserId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.Meeting || !data.Attendee) {
        throw new Error('Failed to create meeting or attendee');
      }

      const { Meeting, Attendee } = data;
      setMeetingId(Meeting.MeetingId!);
      setAttendeeId(Attendee.AttendeeId!);

      // モック参加者として自分を追加
      setAttendees([{
        attendeeId: Attendee.AttendeeId!,
        externalUserId: externalUserId,
        isSpeaking: false,
      }]);

      // 数秒後にランダムで他の参加者を追加（デモ用）
      setTimeout(() => {
        setAttendees(prev => [
          ...prev,
          {
            attendeeId: `attendee-demo-${Date.now()}`,
            externalUserId: 'demo-user',
            isSpeaking: Math.random() > 0.5,
          }
        ]);
      }, 2000);

      setIsInCall(true);
      setIsConnecting(false);

      console.log('Successfully joined test meeting');
    } catch (err) {
      console.error('Failed to join test meeting:', err);
      setError(err instanceof Error ? err.message : 'Failed to join meeting');
      setIsConnecting(false);
    }
  }, [roomId, externalUserId]);

  // 会議から退出
  const leaveMeeting = useCallback(async () => {
    try {
      // 会議を削除
      if (meetingId) {
        try {
          const response = await fetch(`/api/test-meetings?meetingId=${meetingId}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            console.error('Failed to delete meeting:', response.statusText);
          }
        } catch (err) {
          console.error('Failed to delete meeting:', err);
        }
      }

      setIsInCall(false);
      setAttendees([]);
      setMeetingId(null);
      setAttendeeId(null);
      onCallEnd?.();
    } catch (err) {
      console.error('Failed to leave meeting:', err);
      setError(err instanceof Error ? err.message : 'Failed to leave meeting');
    }
  }, [meetingId, onCallEnd]);

  // ミュート切り替え
  const toggleMute = useCallback(async () => {
    setIsMuted(!isMuted);
    console.log(isMuted ? 'Unmuted' : 'Muted');
  }, [isMuted]);

  // スピーカー切り替え
  const toggleSpeaker = useCallback(async () => {
    setIsSpeakerOn(!isSpeakerOn);
    console.log(isSpeakerOn ? 'Speaker off' : 'Speaker on');
  }, [isSpeakerOn]);

  // 再接続処理
  const handleReconnect = useCallback(async () => {
    if (isReconnecting) return;
    
    try {
      setIsReconnecting(true);
      setError(null);
      
      // 少し待ってから再接続
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 会議に再接続
      await joinMeeting();
    } catch (err) {
      console.error('Reconnection failed:', err);
      setError('再接続に失敗しました');
    } finally {
      setIsReconnecting(false);
    }
  }, [isReconnecting, joinMeeting]);

  // 定期的に発話状態をランダムに変更（デモ用）
  useEffect(() => {
    if (!isInCall) return;

    const interval = setInterval(() => {
      setAttendees(prev => 
        prev.map(attendee => ({
          ...attendee,
          isSpeaking: Math.random() > 0.7
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [isInCall]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <h3 className="text-lg font-bold text-red-600 mb-4">通話エラー</h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="flex space-x-2">
            <button
              onClick={() => setError(null)}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg"
            >
              閉じる
            </button>
            <button
              onClick={() => {
                setError(null);
                handleReconnect();
              }}
              disabled={isReconnecting}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg disabled:opacity-50"
            >
              {isReconnecting ? '再接続中...' : '再試行'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isInCall) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4">音声通話テスト</h3>
          <p className="text-gray-600 mb-6">
            このテストでは、Chime SDKの代わりにモック実装を使用します。<br/>
            UIの動作確認が可能です。
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => onCallEnd?.()}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg"
            >
              キャンセル
            </button>
            <button
              onClick={joinMeeting}
              disabled={isConnecting}
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg disabled:opacity-50"
            >
              {isConnecting ? '接続中...' : 'テスト開始'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800">音声通話テスト中</h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600">接続中 (モック)</span>
          </div>
        </div>

        {/* 参加者リスト */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">参加者 ({attendees.length})</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {attendees.map((attendee) => (
              <div
                key={attendee.attendeeId}
                className={`flex items-center space-x-2 p-2 rounded-lg ${
                  attendee.isSpeaking ? 'bg-blue-100' : 'bg-gray-50'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  attendee.isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
                <span className="text-sm text-gray-700">
                  {attendee.externalUserId}
                </span>
                {attendee.attendeeId === attendeeId && (
                  <span className="text-xs text-blue-600">(あなた)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* コントロールボタン */}
        <div className="flex items-center justify-center space-x-4">
          {/* ミュートボタン */}
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isMuted ? 'bg-red-500' : 'bg-gray-300'
            }`}
          >
            {isMuted ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* スピーカーボタン */}
          <button
            onClick={toggleSpeaker}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isSpeakerOn ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            {isSpeakerOn ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>

          {/* 通話終了ボタン */}
          <button
            onClick={leaveMeeting}
            className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l18 18" />
            </svg>
          </button>
        </div>

        {/* ステータス表示 */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            {isMuted ? 'ミュート中' : '通話中'} (テストモード)
          </p>
          {isReconnecting && (
            <p className="text-sm text-yellow-600 mt-1">
              再接続中...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestVoiceCallComponent;
