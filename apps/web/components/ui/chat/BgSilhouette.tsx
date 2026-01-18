import React from 'react'

const BgSilhouette: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* 左上のシルエット */}
      <div className="absolute top-20 left-10 opacity-5">
        <div className="w-32 h-32 bg-gray-900 rounded-full"></div>
      </div>
      
      {/* 右上のシルエット */}
      <div className="absolute top-32 right-8 opacity-5">
        <div className="w-24 h-24 bg-gray-900 rounded-full"></div>
      </div>
      
      {/* 左下のシルエット */}
      <div className="absolute bottom-40 left-6 opacity-5">
        <div className="w-20 h-20 bg-gray-900 rounded-full"></div>
      </div>
      
      {/* 右下のシルエット */}
      <div className="absolute bottom-32 right-12 opacity-5">
        <div className="w-28 h-28 bg-gray-900 rounded-full"></div>
      </div>
      
      {/* 中央上部のシルエット */}
      <div className="absolute top-60 left-1/2 transform -translate-x-1/2 opacity-5">
        <div className="w-16 h-16 bg-gray-900 rounded-full"></div>
      </div>
    </div>
  )
}

export default BgSilhouette
