import React from 'react';

interface WonderlandSectionHeaderProps {
  title: string;
  count: number;
}

export const WonderlandSectionHeader: React.FC<WonderlandSectionHeaderProps> = ({
  title,
  count
}) => {
  return (
    <div className="wonderland-section-header">
      <h2 className="section-title">
        {title} ({count})
      </h2>
      
      <style jsx>{`
        .wonderland-section-header {
          margin-bottom: 1.5rem;
          padding: 0 0.5rem;
        }
        
        .section-title {
          font-family: 'Georgia', serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: #4a5568;
          letter-spacing: -0.01em;
          text-shadow: 0 1px 2px rgba(74, 85, 104, 0.05);
          position: relative;
          display: inline-block;
        }
        
        .section-title::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, 
            rgba(255, 182, 193, 0.4) 0%, 
            rgba(255, 215, 0, 0.4) 100%);
          border-radius: 1px;
        }
        
        @media (max-width: 768px) {
          .wonderland-section-header {
            margin-bottom: 1.25rem;
          }
          
          .section-title {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};
