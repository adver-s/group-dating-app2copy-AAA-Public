'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { apiGet, apiPost } from '@/utils/api';
import Icon from '../../../components/Icon';
import FooterNav from '../../../components/FooterNav';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  bio?: string;
  age?: number;
  gender?: number;
  location?: string;
  interests?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function AccountPage() {
  const { user, getAccessToken } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [editData, setEditData] = useState({
    username: '',
    bio: '',
    age: '',
    gender: '1',
    location: '',
    interests: [] as string[]
  });

  // 興味・関心の候補リスト
  const availableInterests = [
    '映画鑑賞', '読書', '音楽', 'スポーツ', '旅行', '料理', 'ゲーム',
    'アニメ', 'カフェ巡り', '写真撮影', 'アート', 'ファッション',
    'ペット', 'ガーデニング', 'DIY', 'ダンス', 'ヨガ', 'ジム',
    '登山', 'キャンプ', '釣り', 'ゴルフ', 'テニス', 'サッカー',
    '野球', 'バスケットボール', 'バレーボール', '卓球', 'ボウリング'
  ];

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const accessToken = getAccessToken();
      const response = await fetch('/api/me/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditData({
          username: data.username || '',
          bio: data.bio || '',
          age: data.age?.toString() || '',
          gender: data.gender?.toString() || '1',
          location: data.location || '',
          interests: data.interests || []
        });
      } else {
        throw new Error('プロフィールの取得に失敗しました');
      }
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      setError('プロフィールの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEditData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setEditData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const accessToken = getAccessToken();
      const response = await fetch('/api/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          username: editData.username,
          bio: editData.bio,
          age: editData.age ? parseInt(editData.age) : undefined,
          gender: parseInt(editData.gender),
          location: editData.location,
          interests: editData.interests
        })
      });

      if (response.ok) {
        setSuccess('プロフィールを更新しました');
        // プロフィール情報を再取得
        await fetchProfile();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'プロフィールの更新に失敗しました');
      }
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      setError('プロフィールの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center mb-6">
            <Icon name="user" className="w-6 h-6 text-blue-500 mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">アカウント設定</h1>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ユーザー名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ユーザー名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={editData.username}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ユーザー名を入力してください"
              />
              <p className="text-sm text-gray-500 mt-1">
                この名前が他のユーザーに表示されます
              </p>
            </div>

            {/* メールアドレス（表示のみ） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                メールアドレスの変更は管理者にお問い合わせください
              </p>
            </div>

            {/* 自己紹介 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                自己紹介
              </label>
              <textarea
                name="bio"
                value={editData.bio}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="自己紹介を入力してください"
              />
            </div>

            {/* 年齢 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                年齢
              </label>
              <input
                type="number"
                name="age"
                value={editData.age}
                onChange={handleInputChange}
                min="18"
                max="100"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="年齢を入力してください"
              />
            </div>

            {/* 性別 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                性別
              </label>
              <select
                name="gender"
                value={editData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1">男性</option>
                <option value="2">女性</option>
                <option value="0">その他</option>
              </select>
            </div>

            {/* 居住地 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                居住地
              </label>
              <input
                type="text"
                name="location"
                value={editData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="居住地を入力してください"
              />
            </div>

            {/* 興味・関心 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                興味・関心
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {availableInterests.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleInterestToggle(interest)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      editData.interests.includes(interest)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
              {editData.interests.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  選択中: {editData.interests.join(', ')}
                </p>
              )}
            </div>

            {/* 更新ボタン */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={saving}
                className={`px-8 py-4 rounded-lg text-lg font-medium transition-colors ${
                  saving
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {saving ? '更新中...' : 'プロフィールを更新'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <FooterNav activeTab="me" />
    </div>
  );
} 