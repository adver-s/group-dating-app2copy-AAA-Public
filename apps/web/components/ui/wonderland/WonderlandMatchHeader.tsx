import React from 'react';

interface WonderlandMatchHeaderProps {
  title: string;
  subtitle: string;
}

export const WonderlandMatchHeader: React.FC<WonderlandMatchHeaderProps> = ({
  title,
  subtitle
}) => {
  return (
    <div className="wonderland-match-header">
      <div className="header-content">
        <div className="title-section">
          <h1 className="main-title">{title}</h1>
          <div className="subtitle-section">
            <div className="check-icon">✓</div>
            <p className="subtitle">{subtitle}</p>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .wonderland-match-header {
          background: linear-gradient(135deg, #fefefe 0%, #faf8f5 100%);
          border-bottom: 2px solid rgba(255, 182, 193, 0.2);
          padding: 1.5rem 1rem;
          position: relative;
          overflow: hidden;
        }
        
        .wonderland-match-header::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(255, 182, 193, 0.3) 20%, 
            rgba(255, 215, 0, 0.3) 50%, 
            rgba(255, 182, 193, 0.3) 80%, 
            transparent 100%);
        }
        
        .header-content {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .title-section {
          text-align: center;
        }
        
        .main-title {
          font-family: 'Georgia', serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: #4a5568;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
          text-shadow: 0 1px 2px rgba(74, 85, 104, 0.1);
        }
        
        .subtitle-section {
          display: none;
        }
        
        .check-icon {
          display: none;
        }
        
        .subtitle {
          display: none;
        }
        
        @media (max-width: 768px) {
          .wonderland-match-header {
            padding: 1.25rem 1rem;
          }
          
          .main-title {
            font-size: 2rem;
          }
          
          .subtitle {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
};
