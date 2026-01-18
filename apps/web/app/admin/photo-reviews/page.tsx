'use client'

import React, { useEffect, useState } from 'react';
import Icon from '../../../components/Icon';
import { apiGet, apiPost } from '@/utils/api';

interface PhotoReview {
  id: string;
  photoUrl: string;
  teamName: string;
  userName: string;
  photoType: 'team' | 'user';
  status: 'pending_review' | 'active' | 'rejected';
  moderationResult: {
    isApproved: boolean;
    confidence: number;
    labels: Array<{
      name: string;
      confidence: number;
    }>;
    reasons: string;
  } | null;
  createdAt: string;
  originalType?: string | null;
}

// 画像URLを適切に処理するヘルパー関数
const getImageUrl = async (photoUrl: string): Promise<string> => {
  console.log('🔍 画像URL処理開始:', photoUrl ? photoUrl.substring(0, 100) + '...' : 'No URL');
  
  // 空のURLの場合はデフォルト画像を返す
  if (!photoUrl || photoUrl.trim() === '') {
    console.log('⚠️ 空のURLのため、デフォルト画像を使用');
    return 'https://via.placeholder.com/400x300/cccccc/666666?text=No+Image';
  }
  
  // Base64画像の場合はそのまま返す
  if (photoUrl.startsWith('data:image/')) {
    console.log('✅ Base64画像をそのまま使用');
    return photoUrl;
  }
  
  // プレースホルダー画像の場合は内蔵SVGへフォールバック
  if (photoUrl.startsWith('https://via.placeholder.com/')) {
    console.log('✅ プレースホルダー画像をデータURIにフォールバック');
    const svg = encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>` +
      `<rect width='100%' height='100%' fill='#e5e7eb'/>` +
      `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#6b7280' font-size='20'>No Image</text>` +
      `</svg>`
    )
    return `data:image/svg+xml;charset=UTF-8,${svg}`
  }
  
  // ローカルパスの場合はそのまま返す（/api/images/[...path]で処理される）
  if (photoUrl.startsWith('/uploads/')) {
    console.log('🔍 管理者画面: /uploads/ パスをそのまま使用:', photoUrl);
    return photoUrl;
  }

  // Base64はそのまま
  if (photoUrl.startsWith('data:image/')) {
    console.log('✅ Base64画像をそのまま使用');
    return photoUrl;
  }

  // プレースホルダー画像の場合はデータURIにフォールバック
  if (photoUrl.startsWith('https://via.placeholder.com/')) {
    console.log('✅ プレースホルダー画像をデータURIにフォールバック');
    const svg = encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>` +
      `<rect width='100%' height='100%' fill='#e5e7eb'/>` +
      `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#6b7280' font-size='20'>No Image</text>` +
      `</svg>`
    )
    return `data:image/svg+xml;charset=UTF-8,${svg}`
  }
  
  // S3 URLの場合は署名付きURLを取得
  if (photoUrl.startsWith('https://') && photoUrl.includes('s3.')) {
    try {
      console.log('📤 S3画像の署名付きURLを取得中...');
      console.log('📤 リクエストURL:', photoUrl);
      
      const response = await fetch(`/api/images/presigned-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: photoUrl }),
      });
      
      console.log('📤 レスポンスステータス:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📤 レスポンスデータ:', data);
        
        if (data.success && data.presignedUrl) {
          console.log('✅ 署名付きURL取得成功:', data.presignedUrl.substring(0, 100) + '...');
          return data.presignedUrl;
        } else {
          console.error('❌ 署名付きURL取得失敗: レスポンスにURLがありません', data);
          return photoUrl; // 元のURLを返す
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ 署名付きURL取得失敗:', response.status, response.statusText, errorData);
        // 失敗時は元のURLを返す
        return photoUrl;
      }
    } catch (error) {
      console.error('❌ 署名付きURL取得エラー:', error);
      // エラー時は元のURLを返す
      return photoUrl;
    }
  }
  
  // その他のURLの場合はそのまま返す
  console.log('✅ その他のURLをそのまま使用');
  return photoUrl;

  // エラー時はプレースホルダー画像を返す
  console.log('⚠️ 画像URL処理でエラー発生、プレースホルダー画像を使用');
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>` +
    `<rect width='100%' height='100%' fill='#e5e7eb'/>` +
    `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#6b7280' font-size='20'>No Image</text>` +
    `</svg>`
  )
  return `data:image/svg+xml;charset=UTF-8,${svg}`
};

export default function PhotoReviewDashboard() {
  const [reviews, setReviews] = useState<PhotoReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<PhotoReview | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [awsStatus, setAwsStatus] = useState<any>(null);
  const [testingAws, setTestingAws] = useState(false);

  useEffect(() => {
    fetchReviews();
    checkAwsConnection();
  }, []);

  const checkAwsConnection = async () => {
    try {
      setTestingAws(true);
      const response = await fetch('/api/debug/check-aws');
      const data = await response.json();
      setAwsStatus(data);
      console.log('🔍 AWS接続テスト結果:', data);
    } catch (error) {
      console.error('❌ AWS接続テストエラー:', error);
      setAwsStatus({ success: false, error: '接続テストに失敗しました' });
    } finally {
      setTestingAws(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      console.log('🔍 画像レビューデータを取得中...');
      
      const response = await apiGet<any>('/admin/photo-reviews');
      console.log('🔍 API レスポンス:', response);
      
      if (response.success && response.data) {
        // apiGet関数のレスポンス構造: { data: { success: true, data: [...] }, success: true }
        const apiResponse = response.data;
        console.log('🔍 API内部レスポンス:', apiResponse);
        
        if (apiResponse.success && apiResponse.data) {
          const reviewsData = apiResponse.data;
          console.log('📸 取得した画像レビューデータ:', reviewsData);
          
          // 各画像の詳細をログ出力
          if (Array.isArray(reviewsData)) {
            console.log('📸 画像数:', reviewsData.length);
            reviewsData.forEach((review: any, index: number) => {
              console.log(`📸 画像 ${index + 1}:`, {
                id: review.id,
                photoUrl: review.photoUrl ? review.photoUrl.substring(0, 100) + '...' : 'No URL',
                status: review.status,
                photoType: review.photoType,
                teamName: review.teamName,
                userName: review.userName
              });
            });
            
            setReviews(reviewsData);
          } else {
            console.error('❌ レスポンスが配列ではありません:', reviewsData);
            setReviews([]);
          }
        } else {
          console.error('❌ API内部レスポンスエラー:', apiResponse);
          setReviews([]);
        }
      } else {
        console.error('❌ API エラー:', response.error);
        setReviews([]);
      }
    } catch (error) {
      console.error('❌ 画像レビュー取得エラー:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (reviewId: string, status: 'active' | 'rejected', notes?: string) => {
    try {
      await apiPost(`/admin/photo-reviews/${reviewId}/review`, {
        status,
        notes
      });
      
      // レビューリストを更新
      await fetchReviews();
      
      // 成功メッセージを表示
      const statusText = status === 'active' ? '承認' : '却下';
      alert(`画像を${statusText}しました`);
      
      // 承認された場合は、他の画面での画像表示を即座に更新するため、
      // 関連するAPIのキャッシュをクリアすることを推奨
      if (status === 'active') {
        console.log('✅ 画像が承認されました。他の画面での表示が更新されます。');
      }
    } catch (error) {
      console.error('Review failed:', error);
      alert('審査の実行に失敗しました');
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true;
    if (filter === 'pending') return review.status === 'pending_review';
    if (filter === 'approved') return review.status === 'active';
    if (filter === 'rejected') return review.status === 'rejected';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">画像審査ダッシュボード</h1>
          
          {/* AWS接続テスト */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">AWS接続状況</h3>
              <button
                onClick={checkAwsConnection}
                disabled={testingAws}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {testingAws ? 'テスト中...' : '接続テスト'}
              </button>
            </div>
            {awsStatus && (
              <div className={`text-sm p-2 rounded ${awsStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {awsStatus.success ? (
                  <div>
                    <p>✅ AWS接続正常</p>
                    <p className="text-xs mt-1">バケット数: {awsStatus.s3Test?.bucketCount || 0}</p>
                  </div>
                ) : (
                  <div>
                    <p>❌ AWS接続エラー</p>
                    <p className="text-xs mt-1">{awsStatus.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* 統計情報 */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{reviews.length}</div>
              <div className="text-sm text-gray-600">総数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {reviews.filter(r => r.status === 'pending_review').length}
              </div>
              <div className="text-sm text-gray-600">審査待ち</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {reviews.filter(r => r.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">承認済み</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {reviews.filter(r => r.status === 'rejected').length}
              </div>
              <div className="text-sm text-gray-600">却下済み</div>
            </div>
          </div>

          {/* フィルター */}
          <div className="flex space-x-2 mb-4">
            {[
              { key: 'all', label: 'すべて' },
              { key: 'pending', label: '審査待ち' },
              { key: 'approved', label: '承認済み' },
              { key: 'rejected', label: '却下済み' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((review) => (
            <PhotoReviewCard
              key={review.id}
              review={review}
              onReview={handleReview}
              onSelect={() => setSelectedReview(review)}
            />
          ))}
        </div>

        {filteredReviews.length === 0 && (
          <div className="text-center py-12">
            <Icon name="image" className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">審査対象の画像がありません</p>
          </div>
        )}

        {/* 詳細モーダル */}
        {selectedReview && (
          <ReviewDetailModal
            review={selectedReview}
            onClose={() => setSelectedReview(null)}
            onReview={handleReview}
          />
        )}
      </div>
    </div>
  );
}

// 審査カードコンポーネント
const PhotoReviewCard: React.FC<{
  review: PhotoReview;
  onReview: (reviewId: string, status: 'active' | 'rejected', notes?: string) => void;
  onSelect: () => void;
}> = ({ review, onReview, onSelect }) => {
  const [imageUrl, setImageUrl] = useState<string>('https://via.placeholder.com/400x300/cccccc/666666?text=Loading...')
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    let isMounted = true;
    
    const loadImage = async () => {
      try {
        setImageLoading(true)
        setImageError(false)
        console.log('🔍 画像読み込み開始:', review.photoUrl ? review.photoUrl.substring(0, 100) + '...' : 'No URL')
        const url = await getImageUrl(review.photoUrl)
        
        if (isMounted) {
          console.log('✅ 画像URL取得成功:', url.substring(0, 100) + '...')
          setImageUrl(url)
        }
      } catch (error) {
        console.error('❌ 画像URL取得エラー:', error)
        if (isMounted) {
          setImageUrl('https://via.placeholder.com/400x300/cccccc/666666?text=Image+Error')
          setImageError(true)
        }
      } finally {
        if (isMounted) {
          setImageLoading(false)
        }
      }
    }

    loadImage()
    
    return () => {
      isMounted = false;
    };
  }, [review.photoUrl])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_review': return '審査待ち';
      case 'active': return '承認済み';
      case 'rejected': return '却下済み';
      default: return '不明';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow">
      {/* デバッグ情報 */}
      <div className="text-xs text-gray-400 mb-2">
        <div>ID: {review.id}</div>
        <div>タイプ: {review.photoType} {review.originalType && `(${review.originalType})`}</div>
        <div>URL: {review.photoUrl ? review.photoUrl.substring(0, 50) + '...' : 'No URL'}</div>
        <div>表示URL: {imageUrl.substring(0, 50)}...</div>
        {imageError && <span className="text-red-500">(エラー)</span>}
        {imageLoading && <span className="text-blue-500">(読み込み中)</span>}
      </div>
      <div className="relative mb-3">
        {imageLoading && (
          <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        {imageError && (
          <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 mb-2">画像の読み込みに失敗しました</p>
              <p className="text-xs text-gray-400">元URL: {review.photoUrl.substring(0, 30)}...</p>
              <p className="text-xs text-gray-400">表示URL: {imageUrl.substring(0, 30)}...</p>
            </div>
          </div>
        )}
        <img
          src={imageUrl}
          alt="審査対象画像"
          className={`w-full h-48 object-cover rounded-lg ${imageLoading || imageError ? 'hidden' : ''}`}
          onClick={onSelect}
          onError={(e) => {
            // 画像読み込みエラー時の処理
            const target = e.target as HTMLImageElement;
            console.error('❌ 画像カード読み込みエラー:', {
              originalUrl: review.photoUrl,
              displayUrl: imageUrl,
              error: e
            });
            // エラー時はデータURIのプレースホルダー画像を表示
            const svg = encodeURIComponent(
              `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>` +
              `<rect width='100%' height='100%' fill='#e5e7eb'/>` +
              `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#6b7280' font-size='20'>Image Error</text>` +
              `</svg>`
            )
            target.src = `data:image/svg+xml;charset=UTF-8,${svg}`;
            setImageLoading(false);
            setImageError(true);
          }}
          onLoad={() => {
            // 画像読み込み成功時の処理
            console.log('✅ 画像カード読み込み成功:', {
              originalUrl: review.photoUrl,
              displayUrl: imageUrl
            });
            setImageLoading(false);
            setImageError(false);
          }}
        />
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(review.status)}`}>
            {getStatusText(review.status)}
          </span>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-800">{review.teamName}</h3>
          <span className={`px-2 py-1 text-xs rounded-full ${
            review.photoType === 'team' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-purple-100 text-purple-800'
          }`}>
            {review.photoType === 'team' ? 'チーム画像' : '個人画像'}
            {review.originalType && review.originalType !== 'team_photo' && (
              <span className="ml-1">({review.originalType})</span>
            )}
          </span>
        </div>
        <p className="text-sm text-gray-600">{review.userName}</p>
        <p className="text-xs text-gray-500">
          {new Date(review.createdAt).toLocaleString('ja-JP')}
        </p>
      </div>

      {/* 自動審査結果 */}
      {review.moderationResult && (
        <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
          <div className="flex justify-between mb-1">
            <span>自動審査:</span>
            <span className={review.moderationResult.isApproved ? 'text-green-600' : 'text-red-600'}>
              {review.moderationResult.isApproved ? 'OK' : 'NG'}
            </span>
          </div>
          <div className="text-gray-600">
            信頼度: {review.moderationResult.confidence.toFixed(1)}%
          </div>
          {review.moderationResult.reasons && (
            <div className="text-gray-600">
              理由: {review.moderationResult.reasons}
            </div>
          )}
        </div>
      )}

      {/* アクションボタン */}
      {review.status === 'pending_review' && (
        <div className="flex space-x-2">
          <button
            onClick={() => onReview(review.id, 'active')}
            className="flex-1 bg-green-500 text-white py-2 px-3 rounded text-sm hover:bg-green-600 transition-colors"
          >
            承認
          </button>
          <button
            onClick={() => onReview(review.id, 'rejected')}
            className="flex-1 bg-red-500 text-white py-2 px-3 rounded text-sm hover:bg-red-600 transition-colors"
          >
            却下
          </button>
        </div>
      )}
    </div>
  );
};

// 詳細モーダルコンポーネント
const ReviewDetailModal: React.FC<{
  review: PhotoReview;
  onClose: () => void;
  onReview: (reviewId: string, status: 'active' | 'rejected', notes?: string) => void;
}> = ({ review, onClose, onReview }) => {
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('https://via.placeholder.com/400x300/cccccc/666666?text=Loading...')
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    let isMounted = true;
    
    const loadImage = async () => {
      try {
        setImageLoading(true)
        setImageError(false)
        console.log('🔍 詳細モーダル画像読み込み開始:', review.photoUrl ? review.photoUrl.substring(0, 100) + '...' : 'No URL')
        const url = await getImageUrl(review.photoUrl)
        
        if (isMounted) {
          console.log('✅ 詳細モーダル画像URL取得成功:', url.substring(0, 100) + '...')
          setImageUrl(url)
        }
      } catch (error) {
        console.error('❌ 詳細モーダル画像URL取得エラー:', error)
        if (isMounted) {
          setImageUrl('https://via.placeholder.com/400x300/cccccc/666666?text=Image+Error')
          setImageError(true)
        }
      } finally {
        if (isMounted) {
          setImageLoading(false)
        }
      }
    }

    loadImage()
    
    return () => {
      isMounted = false;
    };
  }, [review.photoUrl])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">画像審査詳細</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {imageLoading && (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
            {imageError && (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">画像の読み込みに失敗しました</p>
                  <p className="text-xs text-gray-400">URL: {review.photoUrl.substring(0, 50)}...</p>
                </div>
              </div>
            )}
            <img
              src={imageUrl}
              alt="審査対象画像"
              className={`w-full rounded-lg ${imageLoading || imageError ? 'hidden' : ''}`}
              onError={(e) => {
                // 画像読み込みエラー時の処理
                const target = e.target as HTMLImageElement;
                console.error('❌ 詳細モーダル画像読み込みエラー:', imageUrl);
                // エラー時はデータURIのプレースホルダー画像を表示
                const svg = encodeURIComponent(
                  `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>` +
                  `<rect width='100%' height='100%' fill='#e5e7eb'/>` +
                  `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#6b7280' font-size='20'>Image Error</text>` +
                  `</svg>`
                )
                target.src = `data:image/svg+xml;charset=UTF-8,${svg}`;
                setImageLoading(false);
                setImageError(true);
              }}
              onLoad={() => {
                // 画像読み込み成功時の処理
                console.log('✅ 詳細モーダル画像読み込み成功:', review.photoUrl);
                setImageLoading(false);
                setImageError(false);
              }}
            />
          </div>

          <div>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">基本情報</h3>
              <p><strong>タイプ:</strong> {review.photoType === 'team' ? 'チーム画像' : '個人画像'}</p>
              {review.originalType && review.originalType !== 'team_photo' && (
                <p><strong>詳細タイプ:</strong> {review.originalType}</p>
              )}
              <p><strong>{review.photoType === 'team' ? 'チーム' : 'ユーザー'}:</strong> {review.teamName}</p>
              <p><strong>ユーザー:</strong> {review.userName}</p>
              <p><strong>アップロード日時:</strong> {new Date(review.createdAt).toLocaleString('ja-JP')}</p>
            </div>

            {review.moderationResult && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">自動審査結果</h3>
                <div className="p-3 bg-gray-50 rounded">
                  <p><strong>判定:</strong> {review.moderationResult.isApproved ? 'OK' : 'NG'}</p>
                  <p><strong>信頼度:</strong> {review.moderationResult.confidence.toFixed(1)}%</p>
                  {review.moderationResult.labels.length > 0 && (
                    <div>
                      <p><strong>検出されたラベル:</strong></p>
                      <ul className="list-disc list-inside text-sm">
                        {review.moderationResult.labels.map((label, index) => (
                          <li key={index}>
                            {label.name} ({label.confidence.toFixed(1)}%)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {review.status === 'pending_review' && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">手動審査</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="審査コメント（任意）"
                  className="w-full p-2 border rounded text-sm"
                  rows={3}
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => onReview(review.id, 'active', notes)}
                    className="flex-1 bg-green-500 text-white py-2 px-3 rounded text-sm hover:bg-green-600 transition-colors"
                  >
                    承認
                  </button>
                  <button
                    onClick={() => onReview(review.id, 'rejected', notes)}
                    className="flex-1 bg-red-500 text-white py-2 px-3 rounded text-sm hover:bg-red-600 transition-colors"
                  >
                    却下
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 