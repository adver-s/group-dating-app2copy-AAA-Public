import React from 'react';
import { 
  getJudgementStatusText, 
  getJudgementStatusColor, 
  getHiddenUntilText,
  getJudgementDescription 
} from '../utils/displayUtils';

interface Judgement {
  id: string;
  matching_id: string;
  user_id: string;
  target_group_id: string;
  status: number;
  hidden_until: string | null;
  created_at: string;
  updated_at: string;
  user_name: string;
  target_group_name: string;
}

interface JudgementCardProps {
  judgement: Judgement;
  onStatusUpdate?: (userId: string, targetGroupId: string, newStatus: number, hiddenUntil?: string) => void;
}

export default function JudgementCard({ judgement, onStatusUpdate }: JudgementCardProps) {
  const statusText = getJudgementStatusText(judgement.status);
  const statusColor = getJudgementStatusColor(judgement.status);
  const hiddenUntilText = getHiddenUntilText(judgement.hidden_until);
  const description = getJudgementDescription(judgement.status, judgement.hidden_until);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {judgement.user_name} → {judgement.target_group_name}
          </h3>
          <p className="text-sm text-gray-500">
            {description}
          </p>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor} bg-opacity-10`}>
            {statusText}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-700">判定ユーザー</p>
          <p className="text-sm text-gray-900">{judgement.user_name}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">対象グループ</p>
          <p className="text-sm text-gray-900">{judgement.target_group_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-700">作成日時</p>
          <p className="text-sm text-gray-900">
            {new Date(judgement.created_at).toLocaleString('ja-JP')}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">非表示期間</p>
          <p className="text-sm text-gray-900">{hiddenUntilText}</p>
        </div>
      </div>

      {onStatusUpdate && (
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">判定更新</p>
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4, 5].map((status) => (
              <button
                key={status}
                onClick={() => onStatusUpdate(judgement.user_id, judgement.target_group_id, status)}
                disabled={judgement.status === status}
                className={`px-3 py-1 text-xs rounded ${
                  judgement.status === status
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {getJudgementStatusText(status)}
              </button>
            ))}
          </div>
          
          {judgement.status === 3 && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                非表示期間設定
              </label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                 onChange={(e) => {
                   const hiddenUntil = e.target.value ? new Date(e.target.value).toISOString() : undefined;
                   onStatusUpdate(judgement.user_id, judgement.target_group_id, 3, hiddenUntil);
                 }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
} 