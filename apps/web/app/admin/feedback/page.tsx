'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '../../../components/Icon'
import { useAuth } from '../../../contexts/AuthContext'
import { apiRequest } from '@/utils/api'

interface Feedback {
  id: string
  userId: string
  category: string
  title: string
  content: string
  status: string
  priority: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  resolvedBy?: string
  user: {
    id: string
    username: string
    email: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const categoryOptions = [
  { value: 'all', label: 'すべて' },
  { value: 'general', label: '一般的なご意見' },
  { value: 'bug', label: 'バグ報告' },
  { value: 'feature', label: '機能要望' },
  { value: 'complaint', label: '苦情・不満' },
  { value: 'praise', label: '褒め言葉' },
  { value: 'other', label: 'その他' }
]

const statusOptions = [
  { value: 'all', label: 'すべて' },
  { value: 'pending', label: '対応待ち' },
  { value: 'in_progress', label: '対応中' },
  { value: 'resolved', label: '解決済み' },
  { value: 'closed', label: 'クローズ' }
]

const priorityOptions = [
  { value: 'low', label: '低' },
  { value: 'normal', label: '普通' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '緊急' }
]

export default function AdminFeedbackPage() {
  const router = useRouter()
  const { getAccessToken } = useAuth()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [updating, setUpdating] = useState(false)
  
  // フィルター状態
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  // フィードバック一覧を取得
  const fetchFeedbacks = async () => {
    setLoading(true)
    try {
      const accessToken = getAccessToken()
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.search && { search: filters.search })
      })

      const response = await apiRequest(`/api/admin/feedback?${params}`, {}, accessToken)
      
      if (response.ok) {
        const data = await response.json()
        setFeedbacks(data.feedbacks)
        setPagination(data.pagination)
      } else {
        console.error('Failed to fetch feedbacks')
      }
    } catch (error) {
      console.error('Feedback fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedbacks()
  }, [pagination.page, filters])

  // フィードバックを更新
  const updateFeedback = async (id: string, updates: any) => {
    setUpdating(true)
    try {
      const accessToken = getAccessToken()
      const response = await apiRequest('/api/admin/feedback', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates })
      }, accessToken)

      if (response.ok) {
        const data = await response.json()
        setFeedbacks(prev => prev.map(f => f.id === id ? data.feedback : f))
        if (selectedFeedback?.id === id) {
          setSelectedFeedback(data.feedback)
        }
        alert('フィードバックを更新しました')
      } else {
        alert('更新に失敗しました')
      }
    } catch (error) {
      console.error('Feedback update error:', error)
      alert('更新中にエラーが発生しました')
    } finally {
      setUpdating(false)
    }
  }

  // CSVエクスポート
  const exportCSV = async () => {
    try {
      const accessToken = getAccessToken()
      const params = new URLSearchParams({
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.search && { search: filters.search })
      })

      const response = await fetch(`/api/admin/feedback/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `feedback_export_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('エクスポートに失敗しました')
      }
    } catch (error) {
      console.error('CSV export error:', error)
      alert('エクスポート中にエラーが発生しました')
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icon name="arrow-left" className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">フィードバック管理</h1>
          </div>
          <button
            onClick={exportCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            CSVエクスポート
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">検索</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="タイトル、内容、ユーザー名"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">並び順</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="createdAt">作成日時</option>
              <option value="updatedAt">更新日時</option>
              <option value="title">タイトル</option>
              <option value="status">ステータス</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">順序</label>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="desc">降順</option>
              <option value="asc">昇順</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <div key={feedback.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{feedback.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        feedback.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        feedback.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        feedback.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {statusOptions.find(s => s.value === feedback.status)?.label}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        feedback.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        feedback.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        feedback.priority === 'low' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {priorityOptions.find(p => p.value === feedback.priority)?.label}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <p><strong>ユーザー:</strong> {feedback.user.username} ({feedback.user.email})</p>
                      <p><strong>カテゴリ:</strong> {categoryOptions.find(c => c.value === feedback.category)?.label}</p>
                      <p><strong>作成日:</strong> {new Date(feedback.createdAt).toLocaleString('ja-JP')}</p>
                    </div>
                    
                    <p className="text-gray-700 mb-4 line-clamp-2">{feedback.content}</p>
                  </div>
                  
                  <div className="ml-4 space-y-2">
                    <button
                      onClick={() => {
                        setSelectedFeedback(feedback)
                        setShowDetail(true)
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      詳細
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-6">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              前へ
            </button>
            
            <span className="px-3 py-2 text-sm text-gray-600">
              {pagination.page} / {pagination.totalPages} ページ
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              次へ
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetail && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">フィードバック詳細</h2>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Icon name="x-mark" className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">タイトル</h3>
                <p className="text-gray-700">{selectedFeedback.title}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">内容</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedFeedback.content}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">ステータス</h3>
                  <select
                    value={selectedFeedback.status}
                    onChange={(e) => updateFeedback(selectedFeedback.id, { status: e.target.value })}
                    disabled={updating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {statusOptions.filter(s => s.value !== 'all').map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">優先度</h3>
                  <select
                    value={selectedFeedback.priority}
                    onChange={(e) => updateFeedback(selectedFeedback.id, { priority: e.target.value })}
                    disabled={updating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {priorityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">管理者メモ</h3>
                <textarea
                  value={selectedFeedback.adminNotes || ''}
                  onChange={(e) => updateFeedback(selectedFeedback.id, { adminNotes: e.target.value })}
                  disabled={updating}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="内部メモを入力してください"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p><strong>ユーザー:</strong> {selectedFeedback.user.username}</p>
                  <p><strong>メール:</strong> {selectedFeedback.user.email}</p>
                  <p><strong>カテゴリ:</strong> {categoryOptions.find(c => c.value === selectedFeedback.category)?.label}</p>
                </div>
                <div>
                  <p><strong>作成日:</strong> {new Date(selectedFeedback.createdAt).toLocaleString('ja-JP')}</p>
                  <p><strong>更新日:</strong> {new Date(selectedFeedback.updatedAt).toLocaleString('ja-JP')}</p>
                  {selectedFeedback.resolvedAt && (
                    <p><strong>解決日:</strong> {new Date(selectedFeedback.resolvedAt).toLocaleString('ja-JP')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
