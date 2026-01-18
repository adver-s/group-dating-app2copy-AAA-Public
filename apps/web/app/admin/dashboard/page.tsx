'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '../../../components/Icon'

interface DashboardStats {
  verifications: {
    pending: number
    approved: number
    rejected: number
  }
  photos: {
    pending: number
    approved: number
    rejected: number
  }
  reports: {
    pending: number
    investigating: number
    resolved: number
    dismissed: number
  }
  feedback: {
    pending: number
    in_progress: number
    resolved: number
    closed: number
  }
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminUser, setAdminUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats>({
    verifications: { pending: 0, approved: 0, rejected: 0 },
    photos: { pending: 0, approved: 0, rejected: 0 },
    reports: { pending: 0, investigating: 0, resolved: 0, dismissed: 0 },
    feedback: { pending: 0, in_progress: 0, resolved: 0, closed: 0 }
  })

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const adminUserData = localStorage.getItem('adminUser')

      if (!adminToken || !adminUserData) {
        router.push('/auth/admin-login')
        return
      }

      // トークンの有効性をチェック
      const response = await fetch('/api/auth/check-admin', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      if (!response.ok) {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
        router.push('/auth/admin-login')
        return
      }

      const userData = JSON.parse(adminUserData)
      setAdminUser(userData)
      setIsAdmin(true)
      
      // 統計データを取得（モックデータ）
      fetchStats()
    } catch (error) {
      console.error('Admin access check error:', error)
      router.push('/auth/admin-login')
    }
  }

  const fetchStats = async () => {
    // モックデータ（実際のAPIが実装されたら置き換え）
    setStats({
      verifications: { pending: 5, approved: 12, rejected: 3 },
      photos: { pending: 8, approved: 25, rejected: 2 },
      reports: { pending: 3, investigating: 2, resolved: 15, dismissed: 1 },
      feedback: { pending: 7, in_progress: 3, resolved: 12, closed: 2 }
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    router.push('/auth/admin-login')
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">管理者ダッシュボード</h1>
          <div className="flex items-center space-x-4">
            {adminUser && (
              <span className="text-sm text-gray-600">
                ログイン中: {adminUser.username} ({adminUser.role})
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => handleTabChange('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              概要
            </button>
            <button
              onClick={() => handleTabChange('verifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'verifications'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              本人確認
              {stats.verifications.pending > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                  {stats.verifications.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('photos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'photos'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              画像審査
              {stats.photos.pending > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                  {stats.photos.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              通報管理
              {stats.reports.pending > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                  {stats.reports.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('feedback')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'feedback'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              フィードバック管理
              {stats.feedback.pending > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                  {stats.feedback.pending}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="container mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon name="identification" className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">本人確認待ち</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.verifications.pending}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Icon name="camera" className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">画像審査待ち</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.photos.pending}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Icon name="exclamation-triangle" className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">通報対応待ち</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.reports.pending}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Icon name="chart-bar" className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">今日の処理件数</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.verifications.approved + stats.photos.approved + stats.reports.resolved + stats.feedback.resolved}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Icon name="chat-bubble-left-right" className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">フィードバック対応待ち</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.feedback.pending}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* クイックアクション */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">クイックアクション</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => handleTabChange('verifications')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Icon name="identification" className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-sm font-medium text-gray-700">本人確認を審査</span>
                </button>
                <button
                  onClick={() => handleTabChange('photos')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Icon name="camera" className="w-5 h-5 text-green-600 mr-3" />
                  <span className="text-sm font-medium text-gray-700">画像を審査</span>
                </button>
                <button
                  onClick={() => handleTabChange('reports')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Icon name="exclamation-triangle" className="w-5 h-5 text-red-600 mr-3" />
                  <span className="text-sm font-medium text-gray-700">通報を確認</span>
                </button>
                <button
                  onClick={() => handleTabChange('feedback')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Icon name="chat-bubble-left-right" className="w-5 h-5 text-orange-600 mr-3" />
                  <span className="text-sm font-medium text-gray-700">フィードバックを確認</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'verifications' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">本人確認審査</h3>
            <p className="text-gray-600">本人確認審査機能は個別ページで実装予定です。</p>
            <button
              onClick={() => router.push('/admin/verifications')}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              本人確認ページへ
            </button>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">画像審査</h3>
            <p className="text-gray-600">画像審査機能は個別ページで実装予定です。</p>
            <button
              onClick={() => router.push('/admin/photo-reviews')}
              className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              画像審査ページへ
            </button>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">通報管理</h3>
            <p className="text-gray-600">通報管理機能は個別ページで実装予定です。</p>
            <button
              onClick={() => router.push('/admin/reports')}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              通報管理ページへ
            </button>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">フィードバック管理</h3>
            <p className="text-gray-600">フィードバック管理機能は個別ページで実装されています。</p>
            <button
              onClick={() => router.push('/admin/feedback')}
              className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              フィードバック管理ページへ
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
