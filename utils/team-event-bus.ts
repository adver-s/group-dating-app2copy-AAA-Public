type EventCallback = (data?: any) => void;

class TeamEventBus {
  private listeners: Map<string, EventCallback[]> = new Map();

  // イベントを購読
  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)!.push(callback);
    
    // 購読解除関数を返す
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // イベントを発行
  publish(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Event callback error for ${event}:`, error);
        }
      });
    }
  }

  // 特定のイベントのリスナーを削除
  unsubscribe(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // すべてのリスナーをクリア
  clear(): void {
    this.listeners.clear();
  }
}

// シングルトンインスタンス
export const teamEventBus = new TeamEventBus();

// イベント定数
export const TEAM_EVENTS = {
  ACTIVE_TEAM_CHANGED: 'active-team-changed',
  TEAM_DATA_REFRESH: 'team-data-refresh',
  MATCH_FLOW_UPDATED: 'match-flow-updated',
  LIKES_UPDATED: 'likes-updated',
  CHAT_UPDATED: 'chat-updated',
  MEETING_UPDATED: 'meeting-updated',
  MATCHING_STATE_CLEARED: 'matching-state-cleared',
} as const;

export type TeamEventType = typeof TEAM_EVENTS[keyof typeof TEAM_EVENTS];
