'use client'

import { AnimatePresence, motion as motionAny } from 'framer-motion'
import React, { useState } from 'react'
const MotionImg: any = (motionAny as any).img

interface ImageSliderProps {
  images: string[]
  alt: string
  className?: string
}

const ImageSlider: React.FC<ImageSliderProps> = ({ images, alt, className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className={`relative w-full h-48 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl overflow-hidden border border-amber-200 flex items-center justify-center ${className}`}>
        <div className="text-6xl text-gray-400">📷</div>
      </div>
    )
  }

  if (images.length === 1) {
    return (
      <div className={`relative w-full h-48 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl overflow-hidden border border-amber-200 ${className}`}>
        <img
          src={images[0]}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className={`relative w-full h-48 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl overflow-hidden border border-amber-200 ${className}`}>
      {/* 画像表示エリア */}
      <AnimatePresence mode="wait">
        <MotionImg
          key={currentIndex}
          src={images[currentIndex]}
          alt={`${alt} ${currentIndex + 1}`}
          className="w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      </AnimatePresence>

      {/* ナビゲーションボタン */}
      {images.length > 1 && (
        <>
          {/* 前の画像ボタン */}
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all"
            aria-label="前の画像"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* 次の画像ボタン */}
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all"
            aria-label="次の画像"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* インジケーター */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                    ? 'bg-white'
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                  }`}
                aria-label={`画像 ${index + 1} に移動`}
              />
            ))}
          </div>

          {/* 画像カウンター */}
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  )
}

export default ImageSlider
