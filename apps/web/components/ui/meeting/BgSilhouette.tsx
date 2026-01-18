import React from 'react';

interface BgSilhouetteProps {
  src?: string;
  opacity?: number;
  width?: string;
  bottom?: string;
}

const BgSilhouette: React.FC<BgSilhouetteProps> = ({
  src,
  opacity = 0.12,
  width = '75vw',
  bottom = '10vh'
}) => {
  if (!src) return null;

  return (
    <div 
      className="absolute inset-0 z-0 pointer-events-none"
      style={{
        display: 'grid',
        placeItems: 'end center',
        overflow: 'visible'
      }}
    >
      <img
        src={src}
        alt=""
        style={{
          width,
          opacity,
          filter: 'grayscale(40%) contrast(95%)',
          marginBottom: bottom,
          zIndex: 0
        }}
        className="object-contain"
        onError={(e) => {
          // 画像が存在しない場合は非表示にする
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    </div>
  );
};

export default BgSilhouette;
