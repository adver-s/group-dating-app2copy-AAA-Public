import React from 'react';
import { getMatchingFlowStatusText, getMatchingFlowStatusColor } from '../utils/displayUtils';

interface MatchingFlow {
  id: string;
  matching_id: string;
  from_group_id: string;
  to_group_id: string;
  status: number;
  created_at: string;
  updated_at: string;
  from_group_name: string;
  to_group_name: string;
}

interface MatchingFlowCardProps {
  flow: MatchingFlow;
  onStatusUpdate?: (matchingId: string, newStatus: number) => void;
}

export default function MatchingFlowCard({ flow, onStatusUpdate }: MatchingFlowCardProps) {
  const statusText = getMatchingFlowStatusText(flow.status);
  const statusColor = getMatchingFlowStatusColor(flow.status);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {flow.from_group_name} → {flow.to_group_name}
          </h3>
          <p className="text-sm text-gray-500">
            ID: {flow.matching_id}
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
          <p className="text-sm font-medium text-gray-700">送信グループ</p>
          <p className="text-sm text-gray-900">{flow.from_group_name}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">受信グループ</p>
          <p className="text-sm text-gray-900">{flow.to_group_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-700">作成日時</p>
          <p className="text-sm text-gray-900">
            {new Date(flow.created_at).toLocaleString('ja-JP')}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">更新日時</p>
          <p className="text-sm text-gray-900">
            {new Date(flow.updated_at).toLocaleString('ja-JP')}
          </p>
        </div>
      </div>

      {onStatusUpdate && (
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">ステータス更新</p>
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((status) => (
              <button
                key={status}
                onClick={() => onStatusUpdate(flow.matching_id, status)}
                disabled={flow.status === status}
                className={`px-3 py-1 text-xs rounded ${
                  flow.status === status
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {getMatchingFlowStatusText(status).split('（')[0]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 