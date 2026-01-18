import React from 'react'

const BackgroundAnimation: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* シンプルな背景グラデーション */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-blue-50" />
      
      {/* 軽量なパターンオーバーレイ */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }} />
      </div>
    </div>
  )
}

export default BackgroundAnimation