// API呼び出し用のユーティリティ関数

import { verifyToken, decodeToken } from './auth/jwt';

/**
 * AuthorizationヘッダーからJWTを取り出し、sub（ユーザーID）を返す
 * @param req NextRequest
 * @returns userId（sub） or null
 */
export function getUserIdFromRequest(req: any): string | null {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  console.log('🔍 Auth header:', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No valid Authorization header found');
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  console.log('🔍 Token length:', token.length);
  console.log('🔍 Token preview:', token.substring(0, 20) + '...');
  
  try {
    // まずトークンの形式を確認
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.log('❌ Invalid JWT format (should have 3 parts)');
      return null;
    }
    
    const decoded = decodeToken(token);
    console.log('🔍 Decoded token:', decoded ? 'Success' : 'Failed');
    
    if (decoded) {
      console.log('🔍 Token payload keys:', Object.keys(decoded));
      console.log('🔍 Token sub field:', decoded.sub);
      console.log('🔍 Token userId field:', decoded.userId);
      console.log('🔍 Token email field:', decoded.email);
    }
    
    if (decoded && decoded.sub) {
      console.log('✅ User ID extracted from sub:', decoded.sub);
      return decoded.sub;
    } else if (decoded && decoded.userId) {
      console.log('✅ User ID extracted from userId:', decoded.userId);
      return decoded.userId;
    } else {
      console.log('❌ No valid user ID found in token');
      return null;
    }
  } catch (e) {
    console.error('❌ JWT decode error:', e);
    
    // トークンの検証も試す
    try {
      const verified = verifyToken(token);
      if (verified && verified.sub) {
        console.log('✅ User ID extracted from verified token:', verified.sub);
        return verified.sub;
      }
    } catch (verifyError) {
      console.error('❌ JWT verification also failed:', verifyError);
    }
    
    return null;
  }
}

/**
 * APIリクエスト用のヘルパー関数
 * @param url APIエンドポイント
 * @param options fetchオプション
 * @param accessToken アクセストークン
 * @returns fetchレスポンス
 */
export async function apiRequest(
  url: string, 
  options: RequestInit = {}, 
  accessToken?: string | null
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // アクセストークンがある場合はAuthorizationヘッダーを追加
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
    console.log('🔍 Added Authorization header with token');
  } else {
    console.log('🔍 No access token provided');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

const API_BASE_URL = '/api'

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  success?: boolean
}

// GETリクエスト
export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    // ローカルストレージからアクセストークンを取得
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      },
    })
    
    if (!response.ok) {
      // エラーレスポンスの場合、テキストとして読み取ってからJSONパースを試す
      const errorText = await response.text()
      try {
        const errorData = JSON.parse(errorText)
        return { error: errorData.error || 'Request failed' }
      } catch {
        return { error: errorText || 'Request failed' }
      }
    }
    
    // レスポンスが空でない場合のみJSONパースを試す
    const responseText = await response.text()
    if (!responseText.trim()) {
      return { data: null, success: true }
    }
    
    try {
      const data = JSON.parse(responseText)
      return { data, success: true }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return { error: 'Invalid JSON response' }
    }
  } catch (error) {
    console.error('API request error:', error)
    return { error: 'Network error' }
  }
}

// POSTリクエスト
export async function apiPost<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
  try {
    // ローカルストレージからアクセストークンを取得
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      },
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      // エラーレスポンスの場合、テキストとして読み取ってからJSONパースを試す
      const errorText = await response.text()
      try {
        const errorData = JSON.parse(errorText)
        return { error: errorData.error || 'Request failed' }
      } catch {
        return { error: errorText || 'Request failed' }
      }
    }
    
    // レスポンスが空でない場合のみJSONパースを試す
    const responseText = await response.text()
    if (!responseText.trim()) {
      return { data: null, success: true }
    }
    
    try {
      const data = JSON.parse(responseText)
      return { data, success: true }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return { error: 'Invalid JSON response' }
    }
  } catch (error) {
    console.error('API request error:', error)
    return { error: 'Network error' }
  }
}

// PUTリクエスト
export async function apiPut<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      // エラーレスポンスの場合、テキストとして読み取ってからJSONパースを試す
      const errorText = await response.text()
      try {
        const errorData = JSON.parse(errorText)
        return { error: errorData.error || 'Request failed' }
      } catch {
        return { error: errorText || 'Request failed' }
      }
    }
    
    // レスポンスが空でない場合のみJSONパースを試す
    const responseText = await response.text()
    if (!responseText.trim()) {
      return { data: null, success: true }
    }
    
    try {
      const data = JSON.parse(responseText)
      return { data, success: true }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return { error: 'Invalid JSON response' }
    }
  } catch (error) {
    console.error('API request error:', error)
    return { error: 'Network error' }
  }
}

// DELETEリクエスト
export async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      // エラーレスポンスの場合、テキストとして読み取ってからJSONパースを試す
      const errorText = await response.text()
      try {
        const errorData = JSON.parse(errorText)
        return { error: errorData.error || 'Request failed' }
      } catch {
        return { error: errorText || 'Request failed' }
      }
    }
    
    // レスポンスが空でない場合のみJSONパースを試す
    const responseText = await response.text()
    if (!responseText.trim()) {
      return { data: null, success: true }
    }
    
    try {
      const data = JSON.parse(responseText)
      return { data, success: true }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return { error: 'Invalid JSON response' }
    }
  } catch (error) {
    console.error('API request error:', error)
    return { error: 'Network error' }
  }
}

// ファイルアップロード
export async function apiUpload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      // エラーレスポンスの場合、テキストとして読み取ってからJSONパースを試す
      const errorText = await response.text()
      try {
        const errorData = JSON.parse(errorText)
        return { error: errorData.error || 'Upload failed' }
      } catch {
        return { error: errorText || 'Upload failed' }
      }
    }
    
    // レスポンスが空でない場合のみJSONパースを試す
    const responseText = await response.text()
    if (!responseText.trim()) {
      return { data: null, success: true }
    }
    
    try {
      const data = JSON.parse(responseText)
      return { data, success: true }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return { error: 'Invalid JSON response' }
    }
  } catch (error) {
    console.error('API request error:', error)
    return { error: 'Network error' }
  }
} 