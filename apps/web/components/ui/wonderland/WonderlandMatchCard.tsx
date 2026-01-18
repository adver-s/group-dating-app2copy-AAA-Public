import React from 'react';

export interface WonderlandMatchMeeting {
  id: string;
  teamName: string;
  purpose: string;
  datetime: Date;
  location: string;
  participantCount: number;
  status: 'confirmed';
  teamPhotos?: string[];
}

interface WonderlandMatchCardProps {
  meeting: WonderlandMatchMeeting;
  onCardClick: () => void;
  onMapClick: (e: React.MouseEvent) => void;
  onChatClick: (e: React.MouseEvent) => void;
  id?: string;
}

export const WonderlandMatchCard: React.FC<WonderlandMatchCardProps> = ({
  meeting,
  onCardClick,
  onMapClick,
  onChatClick,
  id
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', { 
      month: 'numeric', 
      day: 'numeric', 
      weekday: 'short' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="wonderland-match-card" onClick={onCardClick} id={id}>
      {/* 装飾枠 */}
      <div className="card-decoration">
        <div className="corner-decoration top-left"></div>
        <div className="corner-decoration top-right"></div>
        <div className="corner-decoration bottom-left"></div>
        <div className="corner-decoration bottom-right"></div>
      </div>
      
      {/* メインコンテンツ */}
      <div className="card-content">
        {/* 画像エリア */}
        <div className="image-section">
          <div className="image-container">
            {meeting.teamPhotos && meeting.teamPhotos.length > 0 ? (
              <img
                src={meeting.teamPhotos[0]}
                alt={meeting.teamName}
                className="team-image"
              />
            ) : (
              <div className="default-image">
                <span className="default-icon">🍺</span>
              </div>
            )}
          </div>
          
          {/* 成立済みリボン */}
          <div className="confirmed-ribbon">
            <div className="ribbon-content">
              <span className="ribbon-text">成立済</span>
            </div>
          </div>
        </div>
        
        {/* テキストコンテンツ */}
        <div className="text-content">
          {/* グループ名 */}
          <h3 className="team-name">{meeting.teamName}</h3>
          
          {/* サブ情報 */}
          <div className="sub-info">
            <div className="info-item">
              <span className="info-icon">🍺</span>
              <span className="info-text">{meeting.purpose}</span>
            </div>
            <div className="info-item">
              <span className="info-icon">👥</span>
              <span className="info-text">{meeting.participantCount}人</span>
            </div>
            <div className="info-item">
              <span className="info-icon">📍</span>
              <span className="info-text">{meeting.location}</span>
            </div>
          </div>
          
          {/* 日時 */}
          <div className="datetime">
            {formatDate(meeting.datetime)} {formatTime(meeting.datetime)}
          </div>
        </div>
        
        {/* アクションボタン */}
        <div className="action-buttons">
          <button
            className="action-btn map-btn"
            onClick={onMapClick}
          >
            地図
          </button>
          <button
            className="action-btn chat-btn w-full h-12"
            onClick={onChatClick}
          >
            チャット
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .wonderland-match-card {
          background: linear-gradient(135deg, #fefefe 0%, #faf8f5 100%);
          border-radius: 24px;
          box-shadow: 
            0 8px 32px rgba(255, 182, 193, 0.12),
            0 4px 16px rgba(255, 215, 0, 0.08);
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          border: 1px solid rgba(255, 182, 193, 0.15);
          overflow: hidden;
          height: fit-content;
        }
        
        .wonderland-match-card:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 12px 40px rgba(255, 182, 193, 0.18),
            0 6px 20px rgba(255, 215, 0, 0.12);
        }
        
        .card-decoration {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }
        
        .corner-decoration {
          position: absolute;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 215, 0, 0.3);
        }
        
        .corner-decoration.top-left {
          top: 12px;
          left: 12px;
          border-right: none;
          border-bottom: none;
          border-radius: 8px 0 0 0;
        }
        
        .corner-decoration.top-right {
          top: 12px;
          right: 12px;
          border-left: none;
          border-bottom: none;
          border-radius: 0 8px 0 0;
        }
        
        .corner-decoration.bottom-left {
          bottom: 12px;
          left: 12px;
          border-right: none;
          border-top: none;
          border-radius: 0 0 0 8px;
        }
        
        .corner-decoration.bottom-right {
          bottom: 12px;
          right: 12px;
          border-left: none;
          border-top: none;
          border-radius: 0 0 8px 0;
        }
        
        .card-content {
          position: relative;
          z-index: 1;
        }
        
        .image-section {
          position: relative;
          margin-bottom: 1.5rem;
        }
        
        .image-container {
          width: 100%;
          height: 160px;
          border-radius: 16px;
          overflow: hidden;
          background: linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 100%);
        }
        
        .team-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }
        
        .default-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 100%);
        }
        
        .default-icon {
          font-size: 3rem;
          opacity: 0.6;
        }
        
        .confirmed-ribbon {
          position: absolute;
          top: 12px;
          right: 12px;
        }
        
        .ribbon-content {
          background: linear-gradient(135deg, #ffb6c1 0%, #ffc6cf 100%);
          border: 1px solid rgba(255, 215, 0, 0.5);
          border-radius: 12px;
          padding: 0.5rem 1rem;
          box-shadow: 0 2px 8px rgba(255, 182, 193, 0.3), 0 0 0 2px rgba(255, 225, 105, 0.22);
        }
        
        .ribbon-text {
          font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          color: #7a4a00; /* 温かみのあるブラウンで黄色アクセントと調和 */
          letter-spacing: 0.05em;
        }
        
        .text-content {
          margin-bottom: 1.5rem;
        }
        
        .team-name {
          font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 1.25rem;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 1rem;
          line-height: 1.3;
        }
        
        .sub-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .info-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .info-icon {
          font-size: 0.875rem;
          opacity: 0.7;
        }
        
        .info-text {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }
        
        .datetime {
          text-align: right;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 0.875rem;
          color: #8b7d9b;
          font-weight: 500;
        }
        
        .action-buttons {
          display: flex;
          gap: 1rem;
        }
        
        .action-btn {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .map-btn {
          background: transparent;
          border: 1px solid #d4b5a0;
          color: #8b7d9b;
        }
        
        .map-btn:hover {
          background: rgba(212, 181, 160, 0.1);
          border-color: #c4a590;
        }
        
        .chat-btn {
          background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%); /* amber-400 → amber-500 */
          color: #ffffff; /* テキストは白 */
          box-shadow: 0 2px 10px rgba(245, 158, 11, 0.35);
          text-shadow: 0 1px 0 rgba(0, 0, 0, 0.18), 0 0 10px rgba(255, 230, 140, 0.85);
          font-weight: 600;
        }
        
        .chat-btn:hover {
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); /* amber-500 → amber-600 */
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.45);
        }
        
        @media (max-width: 768px) {
          .wonderland-match-card {
            padding: 1.25rem;
          }
          
          .image-container {
            height: 140px;
          }
          
          .team-name {
            font-size: 1.125rem;
          }
          
          .action-buttons {
            flex-direction: column;
            gap: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};
