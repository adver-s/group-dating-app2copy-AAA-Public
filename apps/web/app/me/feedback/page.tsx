'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '../../../components/Icon'
import FooterNav from '../../../components/FooterNav'
import { useAuth } from '../../../contexts/AuthContext'
import { apiRequest } from '@/utils/api'

interface Feedback {
  id: string
  category: string
  title: string
  status: string
  priority: string
  createdAt: string
  resolvedAt?: string
}

const categoryOptions = [
  { value: 'general', label: '一般的なご意見' },
  { value: 'bug', label: 'バグ報告' },
  { value: 'feature', label: '機能要望' },
  { value: 'complaint', label: '苦情・不満' },
  { value: 'praise', label: '褒め言葉' },
  { value: 'other', label: 'その他' }
]

const statusLabels = {
  pending: '対応待ち',
  in_progress: '対応中',
  resolved: '解決済み',
  closed: 'クローズ'
}

const priorityLabels = {
  low: '低',
  normal: '普通',
  high: '高',
  urgent: '緊急'
}

export default function FeedbackPage() {
  const router = useRouter()
  const { getAccessToken } = useAuth()
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  
  // フォーム状態
  const [formData, setFormData] = useState({
    category: 'general',
    title: '',
    content: ''
  })

  // フィードバック履歴を取得
  useEffect(() => {
    const fetchFeedbacks = async () => {
      setLoading(true)
      try {
        const accessToken = getAccessToken()
        const response = await apiRequest('/api/feedback', {}, accessToken)
        
        if (response.ok) {
          const data = await response.json()
          setFeedbacks(data.feedbacks)
        }
      } catch (error) {
        console.error('Feedback fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeedbacks()
  }, [getAccessToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('タイトルと内容を入力してください')
      return
    }

    setSubmitting(true)
    try {
      const accessToken = getAccessToken()
      const response = await apiRequest('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      }, accessToken)

      if (response.ok) {
        const data = await response.json()
        alert('ご意見を送信しました')
        
        // フォームをリセット
        setFormData({
          category: 'general',
          title: '',
          content: ''
        })
        
        // 履歴を更新
        setFeedbacks(prev => [data.feedback, ...prev])
        setActiveTab('history')
      } else {
        const errorData = await response.json()
        alert(`送信に失敗しました: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Feedback submission error:', error)
      alert('送信中にエラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon name="arrow-left" className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">ご意見box</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              activeTab === 'form'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ご意見を送信
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            送信履歴
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'form' ? (
        <div className="bg-white px-4 py-6">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリ
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                maxLength={100}
                placeholder="タイトルを入力してください"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/100文字
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                maxLength={2000}
                rows={8}
                placeholder="詳細な内容を入力してください"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.content.length}/2000文字
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  送信中...
                </div>
              ) : (
                '送信する'
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white px-4 py-6">
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="chat-bubble-left-right" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">送信履歴がありません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((feedback) => (
                  <div key={feedback.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {feedback.title}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          feedback.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          feedback.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          feedback.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {statusLabels[feedback.status as keyof typeof statusLabels]}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          feedback.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          feedback.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          feedback.priority === 'low' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {priorityLabels[feedback.priority as keyof typeof priorityLabels]}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>
                        {categoryOptions.find(opt => opt.value === feedback.category)?.label}
                      </span>
                      <span>
                        送信日: {new Date(feedback.createdAt).toLocaleDateString('ja-JP')}
                      </span>
                      {feedback.resolvedAt && (
                        <span>
                          解決日: {new Date(feedback.resolvedAt).toLocaleDateString('ja-JP')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <FooterNav activeTab="profile" />
    </div>
  )
}
