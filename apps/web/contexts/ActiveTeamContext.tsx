'use client'

import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { TEAM_EVENTS, teamEventBus } from '../utils/team-event-bus';
import { useAuth } from './AuthContext';

interface ActiveTeam {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface ActiveTeamContextType {
  activeTeam: ActiveTeam | null;
  loading: boolean;
  error: string | null;
  refreshActiveTeam: () => Promise<void>;
  setActiveTeam: (team: ActiveTeam | null) => void;
}

const ActiveTeamContext = createContext<ActiveTeamContextType | undefined>(undefined);

export const useActiveTeam = () => {
  const context = useContext(ActiveTeamContext);
  if (context === undefined) {
    throw new Error('useActiveTeam must be used within an ActiveTeamProvider');
  }
  return context;
};

interface ActiveTeamProviderProps {
  children: ReactNode;
}

export const ActiveTeamProvider: React.FC<ActiveTeamProviderProps> = ({ children }) => {
  const [activeTeam, setActiveTeam] = useState<ActiveTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAccessToken, isAuthenticated } = useAuth();

  const fetchActiveTeam = async () => {
    try {
      setLoading(true);
      setError(null);

      // 常に実データから取得

      if (!isAuthenticated) {
        setActiveTeam(null);
        return;
      }

      const accessToken = getAccessToken();
      if (!accessToken) {
        setActiveTeam(null);
        return;
      }

      const response = await fetch('/api/me/active-team', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.activeTeam) {
          setActiveTeam({
            id: data.activeTeam.id,
            name: data.activeTeam.name,
            description: data.activeTeam.description,
            isActive: true,
          });
        } else {
          setActiveTeam(null);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'アクティブチームの取得に失敗しました');
        setActiveTeam(null);
      }
    } catch (error) {
      console.error('アクティブチーム取得エラー:', error);
      setError('アクティブチームの取得中にエラーが発生しました');
      setActiveTeam(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshActiveTeam = async () => {
    await fetchActiveTeam();
  };

  useEffect(() => {
    fetchActiveTeam();
  }, [isAuthenticated, getAccessToken]);

  // チーム切り替えイベントを監視
  useEffect(() => {
    const unsubscribe = teamEventBus.subscribe(TEAM_EVENTS.ACTIVE_TEAM_CHANGED, async (data) => {
      console.log('🔄 アクティブチーム変更イベントを受信:', data);
      // アクティブチーム情報を再取得
      await fetchActiveTeam();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const value: ActiveTeamContextType = {
    activeTeam,
    loading,
    error,
    refreshActiveTeam,
    setActiveTeam,
  };

  return (
    <ActiveTeamContext.Provider value={value}>
      {children}
    </ActiveTeamContext.Provider>
  );
};
