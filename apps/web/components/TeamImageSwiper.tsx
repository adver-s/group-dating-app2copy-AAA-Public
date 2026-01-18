'use client'

import { AnimatePresence, motion as motionAny, PanInfo } from 'framer-motion'
import React, { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
const MotionDiv: any = (motionAny as any).div

interface TeamImageSwiperProps {
  images: string[]
  teamName: string
  teamId?: string
  onAddImage?: (img: string) => void
  onUploadImage?: (file: File) => Promise<void>
  isEditable?: boolean
  photoStatuses?: Array<{
    photoUrl: string;
    status: 'pending_review' | 'active' | 'rejected';
    moderationResult?: any;
  }>
}

const TeamImageSwiper: React.FC<TeamImageSwiperProps> = ({
  images,
  teamName,
  teamId,
  onAddImage,
  onUploadImage,
  isEditable = false,
  photoStatuses = []
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showPicker, setShowPicker] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 現在の画像の審査状況を取得
  const getCurrentPhotoStatus = () => {
    if (currentIndex < images.length) {
      return photoStatuses.find(status => status.photoUrl === images[currentIndex]);
    }
    return null;
  };

  const currentPhotoStatus = getCurrentPhotoStatus();

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 50
    const { offset, velocity } = info

    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > 500) {
      if (offset.x > 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
      } else if (offset.x < 0 && currentIndex < images.length - 1) {
        setCurrentIndex(currentIndex + 1)
      }
    }
  }

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  // 画像追加ボタンが押されたとき
  const handleAddImageClick = () => {
    if (isEditable) {
      setShowPicker(true)
    }
  }

  // カメラを開始
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // 背面カメラを優先
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      setCameraStream(stream)
      setShowCamera(true)
      setShowPicker(false)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('カメラの起動に失敗しました:', error)
      alert('カメラの起動に失敗しました。カメラの権限を確認してください。')
    }
  }

  // カメラを停止
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setShowCamera(false)
  }

  // 写真を撮影
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // キャンバスのサイズをビデオに合わせる
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // ビデオの現在フレームをキャンバスに描画
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // キャンバスから画像データを取得
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
        handleFileUpload(file)
      }
    }, 'image/jpeg', 0.8)

    stopCamera()
  }

  // ファイルアップロード処理
  const handleFileUpload = async (fileOrEvent: File | React.ChangeEvent<HTMLInputElement>) => {
    let file: File | undefined

    if (fileOrEvent instanceof File) {
      file = fileOrEvent
    } else {
      file = fileOrEvent.target.files?.[0]
    }

    if (!file) return

    console.log('🔍 画像アップロード開始:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      teamId: teamId
    })

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // 一時的なteamIdの場合は、ファイルをBase64エンコードしてローカルで管理
      if (teamId && teamId.startsWith('temp_')) {
        console.log('📸 一時的なチームIDのため、Base64エンコードで処理')
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          if (onAddImage) {
            onAddImage(result)
          }
          setShowPicker(false)
          alert('画像が追加されました！')
          setIsUploading(false)
          setUploadProgress(0)
        }
        reader.readAsDataURL(file)
        return
      }

      // 通常のteamIdの場合は、S3にアップロード
      if (!teamId) {
        console.error('❌ teamIdがありません')
        throw new Error('Team ID is required')
      }

      console.log('📤 S3アップロードを開始')

      // 1. アップロードURLを取得
      const response = await fetch(`/api/teams/${teamId}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
        }),
      });

      console.log('🔍 アップロードURL取得レスポンス:', {
        status: response.status,
        ok: response.ok
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ アップロードURL取得エラー:', errorData)
        throw new Error(`Failed to get upload URL: ${response.status} ${errorData.error || ''}`)
      }

      const uploadData = await response.json()
      console.log('✅ アップロードURL取得成功:', uploadData)

      // 2. S3にアップロード（uploadUrlがある場合のみ）
      if (uploadData.uploadUrl) {
        console.log('📤 S3へのアップロード開始')
        const uploadResponse = await fetch(uploadData.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        console.log('🔍 S3アップロードレスポンス:', {
          status: uploadResponse.status,
          ok: uploadResponse.ok
        })

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          console.error('❌ S3アップロードエラー:', errorText)
          throw new Error(`Failed to upload to S3: ${uploadResponse.status} ${errorText}`)
        }

        console.log('✅ S3アップロード成功')
      } else {
        console.log('🔧 S3アップロードをスキップ（プレースホルダー画像使用）')
      }

      setUploadProgress(100)

      // 3. 成功時の処理
      if (onAddImage) {
        onAddImage(uploadData.fileUrl)
      }

      setShowPicker(false)
      alert('画像がアップロードされました！')

    } catch (error) {
      console.error('❌ アップロード失敗:', error)
      alert(`アップロードに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // ファイル選択ボタンをクリック
  const handleFileSelectClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // コンポーネントのアンマウント時にカメラを停止
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraStream])

  return (
    <div className="relative w-full h-48 overflow-hidden rounded-lg">
      <AnimatePresence mode="wait">
        <MotionDiv
          key={currentIndex}
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          className="w-full h-full"
        >
          {/* 通常画像 */}
          {currentIndex < images.length ? (
            <>
              <img
                src={images[currentIndex]}
                alt={`${teamName} image ${currentIndex + 1}`}
                className={`w-full h-full object-cover object-center ${currentPhotoStatus?.status === 'pending_review' ? 'grayscale' : ''
                  }`}
                style={{ objectPosition: 'center center' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-white text-2xl font-bold drop-shadow-lg">
                  {teamName}
                </h2>
              </div>

              {/* 編集モード時の追加ボタン */}
              {isEditable && (
                <button
                  type="button"
                  onClick={handleAddImageClick}
                  className="absolute top-2 right-2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
                >
                  <Icon name="plus" className="w-5 h-5 text-gray-700" />
                </button>
              )}

              {/* 審査中のオーバーレイ */}
              {currentPhotoStatus?.status === 'pending_review' && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-white font-medium">審査中</p>
                    <p className="text-white/80 text-sm">しばらくお待ちください</p>
                  </div>
                </div>
              )}

              {/* 審査状況の表示 */}
              {currentPhotoStatus && currentPhotoStatus.status !== 'pending_review' && (
                <div className="absolute top-2 left-2">
                  {currentPhotoStatus.status === 'rejected' && (
                    <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                      不適切
                    </span>
                  )}
                  {currentPhotoStatus.status === 'active' && currentPhotoStatus.moderationResult && (
                    <span className="px-2 py-1 text-xs bg-green-500 text-white rounded-full">
                      承認済み
                    </span>
                  )}
                </div>
              )}
            </>
          ) : (
            /* 追加アイコン */
            <button
              type="button"
              className="w-full h-full flex flex-col items-center justify-center bg-gray-100 hover:bg-gray-200 transition rounded-lg"
              onClick={handleAddImageClick}
            >
              <Icon name="plus" className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-gray-600 text-sm">画像を追加</span>
            </button>
          )}
        </MotionDiv>
      </AnimatePresence>

      {/* ナビゲーションドット */}
      {images.length > 0 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
            />
          ))}
        </div>
      )}

      {/* ナビゲーションボタン */}
      {currentIndex > 0 && (
        <button
          type="button"
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors"
        >
          ←
        </button>
      )}
      {currentIndex < images.length - 1 && (
        <button
          type="button"
          onClick={goToNext}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors"
        >
          →
        </button>
      )}

      {/* 画像選択モーダル */}
      {showPicker && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-4 text-center">画像を追加</h3>

            <div className="space-y-4">
              {/* カメラ撮影 */}
              <button
                type="button"
                onClick={startCamera}
                className="w-full py-4 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-3"
              >
                <Icon name="camera" className="w-5 h-5" />
                <span>カメラで撮影</span>
              </button>

              {/* ファイル選択 */}
              <button
                type="button"
                onClick={handleFileSelectClick}
                className="w-full py-4 px-6 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-3"
              >
                <Icon name="arrow-up-tray" className="w-5 h-5" />
                <span>ギャラリーから選択</span>
              </button>

              {/* 隠しファイル入力 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />

              {isUploading && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-blue-600 mt-1 text-center">アップロード中... {uploadProgress}%</div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="w-full py-3 mt-4 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* カメラモーダル */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* カメラビュー */}
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* 撮影ボタン */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <button
                type="button"
                onClick={takePhoto}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <div className="w-12 h-12 bg-white rounded-full border-4 border-gray-300"></div>
              </button>
            </div>

            {/* キャンセルボタン */}
            <button
              type="button"
              onClick={stopCamera}
              className="absolute top-4 left-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white"
            >
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>

          {/* キャンバス（隠し） */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  )
}

export default TeamImageSwiper 