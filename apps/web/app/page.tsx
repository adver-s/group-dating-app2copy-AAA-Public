'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import Image from 'next/image'
import AdModal from '@/components/AdModal'
import AgeVerificationGuard from '@/components/AgeVerificationGuard'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [showAdModal, setShowAdModal] = useState(false)
  const [modalType, setModalType] = useState<'welcome' | 'recruit' | 'feedback'>('welcome')
  const [videoLoaded, setVideoLoaded] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        // 認証済みの場合はOP動画（5秒）の再生時間に合わせて次のページに自動リダイレクト
        const timer = setTimeout(() => {
          router.push('/teams')
        }, 5000)

        return () => clearTimeout(timer)
      } else {
        // 未認証の場合は認証選択ページにリダイレクト
        router.push('/auth/choice')
      }
    }
  }, [isAuthenticated, loading, router])

  // 動画の自動再生を確実にする
  useEffect(() => {
    const videoElement = document.querySelector('video') as HTMLVideoElement
    if (videoElement) {
      // 動画が読み込まれたら自動再生を試行
      const playVideo = async () => {
        try {
          await videoElement.play()
        } catch (error) {
          console.log('Video autoplay failed:', error)
        }
      }
      
      if (videoElement.readyState >= 2) {
        playVideo()
      } else {
        videoElement.addEventListener('loadeddata', playVideo)
        return () => videoElement.removeEventListener('loadeddata', playVideo)
      }
    }
  }, [])

  // 定期的にモーダル広告を表示
  useEffect(() => {
    const showAdPeriodically = () => {
      const lastAdTime = localStorage.getItem('lastAdTime')
      const currentTime = Date.now()
      const adInterval = 20 * 60 * 1000 // 20分（ミリ秒）

      // 初回表示または20分経過後に表示
      if (!lastAdTime || (currentTime - parseInt(lastAdTime)) > adInterval) {
        const adTimer = setTimeout(() => {
          setShowAdModal(true)
          localStorage.setItem('lastAdTime', currentTime.toString())
        }, 5000) // 5秒後に表示

        return () => clearTimeout(adTimer)
      }
    }

    showAdPeriodically()
  }, [])

  const handleShowAdModal = () => {
    // ランダムにモーダルタイプを選択
    const types: ('welcome' | 'recruit' | 'feedback')[] = ['welcome', 'recruit', 'feedback']
    const randomType = types[Math.floor(Math.random() * types.length)]
    setModalType(randomType)
    setShowAdModal(true)
  }

  const handleCloseAdModal = () => {
    setShowAdModal(false)
  }

  const handleVideoLoad = () => {
    setVideoLoaded(true)
  }

  const handleVideoEnd = () => {
    // 動画終了時に次のページにリダイレクト
    router.push('/teams')
  }

  const handleVideoRef = (videoElement: HTMLVideoElement | null) => {
    if (videoElement) {
      // 動画の自動再生を強制実行
      const playPromise = videoElement.play()
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log('Video autoplay failed:', error)
          // 自動再生に失敗した場合の処理
        })
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-100 relative flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 年齢確認ガードで保護されたコンテンツ
  const protectedContent = (
    <div className="min-h-screen relative">
      {/* 動画コントロールを非表示にするCSS */}
      <style jsx>{`
        video::-webkit-media-controls {
          display: none !important;
        }
        video::-webkit-media-controls-panel {
          display: none !important;
        }
        video::-webkit-media-controls-play-button {
          display: none !important;
        }
        video::-webkit-media-controls-start-playback-button {
          display: none !important;
        }
      `}</style>
      
      {/* 背景動画として表示 */}
      <div className="absolute inset-0">
        <video
          ref={handleVideoRef}
          autoPlay
          muted
          playsInline
          preload="metadata"
          disablePictureInPicture
          disableRemotePlayback
          className="w-full h-full object-cover"
          style={{ 
            objectFit: 'cover',
            pointerEvents: 'none'
          }}
          onLoadedData={handleVideoLoad}
          onCanPlay={handleVideoLoad}
          onEnded={handleVideoEnd}
        >
          <source src="/splash-video.mp4" type="video/mp4" />
          {/* フォールバック用の背景画像 */}
          <Image
            src="/splash-image.png"
            alt="Gather-s from adver-s"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </video>
      </div>
      
      {/* OP動画表示中はローディング表示のみ */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="text-center w-full max-w-sm mx-auto">
          {!videoLoaded ? (
            <div className="animate-pulse">
              <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-gray-500 mt-4">OP動画を読み込み中...</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-white text-lg font-semibold mb-2">
                Gather-s from adver-s
              </div>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-white mt-2">OP動画再生中...</p>
            </div>
          )}
        </div>
      </div>
      
      {/* モーダル広告 */}
      <AdModal 
        isOpen={showAdModal} 
        onClose={handleCloseAdModal} 
      />
    </div>
  )

  return (
    <AgeVerificationGuard>
      {protectedContent}
    </AgeVerificationGuard>
  )
} 