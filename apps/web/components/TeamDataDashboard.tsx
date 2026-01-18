'use client'

import React from 'react';
import { useTeamData } from '../lib/hooks/useTeamData';
import Icon from './Icon';

const TeamDataDashboard: React.FC = () => {
  const { teamData, loading, error, activeTeam } = useTeamData();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">チームデータを読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="text-center py-8">
          <Icon name="alert-circle" className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 mb-2">エラーが発生しました</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!activeTeam) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="text-center py-8">
          <Icon name="users" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-2">アクティブチームがありません</p>
          <p className="text-sm text-gray-500">チームを選択してください</p>
        </div>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="text-center py-8">
          <Icon name="database" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">チームデータが見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* チーム情報ヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{activeTeam.name}</h2>
            {activeTeam.description && (
              <p className="text-gray-600 mt-1">{activeTeam.description}</p>
            )}
          </div>
          <div className="flex items-center">
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              出動中
            </span>
          </div>
        </div>

        {/* チームメンバー情報 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{teamData.teamMembers.total}</div>
            <div className="text-sm text-gray-600">メンバー数</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{teamData.teamMembers.activeMembers.length}</div>
            <div className="text-sm text-gray-600">アクティブ</div>
          </div>
        </div>
      </div>

      {/* マッチングフロー統計 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Icon name="heart" className="w-5 h-5 mr-2 text-red-500" />
          マッチングフロー
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{teamData.matchFlows.sent.length}</div>
            <div className="text-sm text-gray-600">送信済み</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{teamData.matchFlows.received.length}</div>
            <div className="text-sm text-gray-600">受信済み</div>
          </div>
        </div>

        {/* 最近のマッチングフロー */}
        {teamData.matchFlows.flows.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">最近のフロー</h4>
            {teamData.matchFlows.flows.slice(0, 3).map((flow, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">
                    {flow.from_team_name} → {flow.to_team_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(flow.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${flow.status === 3 ? 'bg-green-100 text-green-800' :
                    flow.status === 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                  }`}>
                  {flow.status === 3 ? '成立' : flow.status === 2 ? '保留' : '進行中'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* いいね統計 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Icon name="thumbs-up" className="w-5 h-5 mr-2 text-green-500" />
          いいね統計
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{teamData.likesStats.sent_likes}</div>
            <div className="text-sm text-gray-600">送信いいね</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{teamData.likesStats.received_likes}</div>
            <div className="text-sm text-gray-600">受信いいね</div>
          </div>
        </div>
      </div>

      {/* 成立したマッチング */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Icon name="check-circle" className="w-5 h-5 mr-2 text-green-500" />
          成立したマッチング ({teamData.establishedMatches.total})
        </h3>

        {teamData.establishedMatches.matches.length > 0 ? (
          <div className="space-y-3">
            {teamData.establishedMatches.matches.map((match, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{match.partner_team_name}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(match.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    チャット可能
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon name="message-circle" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">まだ成立したマッチングがありません</p>
          </div>
        )}
      </div>

      {/* 合コン会議 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Icon name="calendar" className="w-5 h-5 mr-2 text-purple-500" />
          合コン会議 ({teamData.meetingProposals.total})
        </h3>

        {teamData.meetingProposals.proposals.length > 0 ? (
          <div className="space-y-3">
            {teamData.meetingProposals.proposals.map((proposal, index) => (
              <div key={index} className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-800">
                    {proposal.proposed_by_team_name} → {proposal.proposed_to_team_name}
                  </p>
                  <span className={`px-2 py-1 text-xs rounded-full ${proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      proposal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                    {proposal.status === 'accepted' ? '承認済み' :
                      proposal.status === 'pending' ? '保留中' : 'その他'}
                  </span>
                </div>
                {proposal.proposed_date && (
                  <p className="text-sm text-gray-600">
                    予定日: {new Date(proposal.proposed_date).toLocaleDateString('ja-JP')}
                  </p>
                )}
                {proposal.proposed_location && (
                  <p className="text-sm text-gray-600">
                    場所: {proposal.proposed_location}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon name="calendar" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">まだ合コン会議の提案がありません</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDataDashboard;
