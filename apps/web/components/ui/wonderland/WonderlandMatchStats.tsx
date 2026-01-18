import React from 'react';

export interface WonderlandMatchStats {
  confirmedCount: number;
  decidedCount: number;
  successRate: number;
}

interface WonderlandMatchStatsProps {
  stats: WonderlandMatchStats;
}

export const WonderlandMatchStats: React.FC<WonderlandMatchStatsProps> = ({ stats }) => {
  return (
    <div className="wonderland-stats-panel">
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-number confirmed">{stats.confirmedCount}</div>
          <div className="stat-label">成立済み</div>
        </div>
        <div className="stat-item">
          <div className="stat-number participants">{stats.decidedCount}</div>
          <div className="stat-label">決定済み</div>
        </div>
        <div className="stat-item">
          <div className="stat-number success">{stats.successRate}%</div>
          <div className="stat-label">成功率</div>
        </div>
      </div>
      
      <style jsx>{`
        .wonderland-stats-panel {
          background: linear-gradient(135deg, #fefefe 0%, #faf8f5 100%);
          border-radius: 20px;
          box-shadow: 
            0 4px 20px rgba(255, 182, 193, 0.15),
            0 2px 8px rgba(255, 182, 193, 0.1);
          padding: 2rem;
          margin-bottom: 2rem;
          border: 1px solid rgba(255, 182, 193, 0.2);
          position: relative;
          overflow: hidden;
        }
        
        .wonderland-stats-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, 
            rgba(255, 182, 193, 0.3) 0%, 
            rgba(255, 215, 0, 0.3) 50%, 
            rgba(255, 182, 193, 0.3) 100%);
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }
        
        .stat-item {
          text-align: center;
          position: relative;
        }
        
        .stat-item::after {
          content: '';
          position: absolute;
          top: 50%;
          right: -1rem;
          transform: translateY(-50%);
          width: 1px;
          height: 60%;
          background: linear-gradient(180deg, 
            transparent 0%, 
            rgba(255, 182, 193, 0.2) 50%, 
            transparent 100%);
        }
        
        .stat-item:last-child::after {
          display: none;
        }
        
        .stat-number {
          font-family: 'Georgia', serif;
          font-size: 2.5rem;
          font-weight: 600;
          line-height: 1;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }
        
        .stat-number.confirmed {
          color: #10b981;
          text-shadow: 0 1px 2px rgba(16, 185, 129, 0.2);
        }
        
        .stat-number.participants {
          color: #8b5cf6;
          text-shadow: 0 1px 2px rgba(139, 92, 246, 0.2);
        }
        
        .stat-number.success {
          color: #f59e0b;
          text-shadow: 0 1px 2px rgba(245, 158, 11, 0.2);
        }
        
        .stat-label {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 0.875rem;
          color: #8b7d9b;
          font-weight: 500;
          letter-spacing: 0.02em;
        }
        
        @media (max-width: 768px) {
          .wonderland-stats-panel {
            padding: 1.5rem;
            margin-bottom: 1.5rem;
          }
          
          .stats-grid {
            gap: 1.5rem;
          }
          
          .stat-number {
            font-size: 2rem;
          }
          
          .stat-label {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};
