"use client";
import { useState } from "react";
import MatchEstablishedModal from "./MatchEstablishedModal";
import dayjs from "dayjs";

export default function ScheduleConfirmationExample() {
  const [open, setOpen] = useState(false);
  const [pid, setPid] = useState<string>("");
  const [scheduled, setScheduled] = useState<string>("");

  const onScheduleConfirmed = (proposalId: string, startsAtISO: string, place?: string) => {
    setPid(proposalId);
    // 表示用フォーマット（必要に応じて編集）
    const txt = dayjs(startsAtISO).format("YYYY/MM/DD(dd) HH:mm") + (place ? `  ${place}` : "");
    setScheduled(txt);
    setOpen(true);
  };

  // テスト用のボタン
  const handleTestSchedule = () => {
    onScheduleConfirmed(
      "test-proposal-123",
      "2025-09-02T19:30:00+09:00",
      "渋谷"
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">予定調整成功時のモーダル表示例</h2>
      
      <button
        onClick={handleTestSchedule}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        テスト：予定調整成功をシミュレート
      </button>

      <MatchEstablishedModal
        open={open}
        proposalId={pid}
        scheduledAt={scheduled}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
