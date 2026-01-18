import { useCallback, useEffect, useState } from 'react';
import { useActiveTeam } from '../../contexts/ActiveTeamContext';
import { useAuth } from '../../contexts/AuthContext';
import { TEAM_EVENTS, teamEventBus } from '@/utils/team-event-bus';

interface TeamData {
  team: any;
  membership: any;
  matchFlows: {
    total: number;
    sent: any[];
    received: any[];
    flows: any[];
  };
  likesStats: {
    sent_likes: number;
    received_likes: number;
    sent_passes: number;
    received_passes: number;
  };
  establishedMatches: {
    total: number;
    matches: any[];
  };
  chatRooms: {
    total: number;
    rooms: any[];
  };
  meetingProposals: {
    total: number;
    proposals: any[];
  };
  teamMembers: {
    total: number;
    members: any[];
    activeMembers: any[];
  };
}

export const useTeamData = () => {
  const { activeTeam } = useActiveTeam();
  const { getAccessToken } = useAuth();
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamData = useCallback(async (teamId: string) => {
    if (!teamId) {
      setTeamData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const accessToken = getAccessToken();
      if (!accessToken) {
        setError('認証が必要です');
        return;
      }

      const response = await fetch(`/api/teams/${teamId}/data`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTeamData(result.data);
          console.log('✅ チームデータ取得成功:', result.data);
        } else {
          setError(result.error || 'データの取得に失敗しました');
          setTeamData(null);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'データの取得に失敗しました');
        setTeamData(null);
      }
    } catch (error) {
      console.error('チームデータ取得エラー:', error);
      setError('データの取得中にエラーが発生しました');
      setTeamData(null);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  // アクティブチームが変更されたときにデータを取得
  useEffect(() => {
    if (activeTeam?.id) {
      fetchTeamData(activeTeam.id);
    } else {
      setTeamData(null);
    }
  }, [activeTeam?.id, fetchTeamData]);

  // イベントリスナーを設定
  useEffect(() => {
    const unsubscribeActiveTeamChanged = teamEventBus.subscribe(
      TEAM_EVENTS.ACTIVE_TEAM_CHANGED,
      (data) => {
        if (data?.teamId && activeTeam?.id === data.teamId) {
          fetchTeamData(data.teamId);
        }
      }
    );

    const unsubscribeTeamDataRefresh = teamEventBus.subscribe(
      TEAM_EVENTS.TEAM_DATA_REFRESH,
      () => {
        if (activeTeam?.id) {
          fetchTeamData(activeTeam.id);
        }
      }
    );

    const unsubscribeMatchFlowUpdated = teamEventBus.subscribe(
      TEAM_EVENTS.MATCH_FLOW_UPDATED,
      () => {
        if (activeTeam?.id) {
          fetchTeamData(activeTeam.id);
        }
      }
    );

    const unsubscribeLikesUpdated = teamEventBus.subscribe(
      TEAM_EVENTS.LIKES_UPDATED,
      () => {
        if (activeTeam?.id) {
          fetchTeamData(activeTeam.id);
        }
      }
    );

    const unsubscribeChatUpdated = teamEventBus.subscribe(
      TEAM_EVENTS.CHAT_UPDATED,
      () => {
        if (activeTeam?.id) {
          fetchTeamData(activeTeam.id);
        }
      }
    );

    const unsubscribeMeetingUpdated = teamEventBus.subscribe(
      TEAM_EVENTS.MEETING_UPDATED,
      () => {
        if (activeTeam?.id) {
          fetchTeamData(activeTeam.id);
        }
      }
    );

    return () => {
      unsubscribeActiveTeamChanged();
      unsubscribeTeamDataRefresh();
      unsubscribeMatchFlowUpdated();
      unsubscribeLikesUpdated();
      unsubscribeChatUpdated();
      unsubscribeMeetingUpdated();
    };
  }, [activeTeam?.id, fetchTeamData]);

  const refreshData = useCallback(() => {
    if (activeTeam?.id) {
      fetchTeamData(activeTeam.id);
    }
  }, [activeTeam?.id, fetchTeamData]);

  return {
    teamData,
    loading,
    error,
    refreshData,
    activeTeam,
  };
};
