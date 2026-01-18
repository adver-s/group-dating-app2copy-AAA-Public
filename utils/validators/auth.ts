import { ValidationError } from '@/utils/errors'

// メールアドレスのバリデーション
export const validateEmail = (email: string): void => {
  if (!email || email.trim().length === 0) {
    throw new ValidationError('メールアドレスは必須です')
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ValidationError('有効なメールアドレスを入力してください')
  }
  
  if (email.length > 254) {
    throw new ValidationError('メールアドレスが長すぎます')
  }
}

// パスワードのバリデーション
export const validatePassword = (password: string): void => {
  if (!password || password.length === 0) {
    throw new ValidationError('パスワードは必須です')
  }
  
  if (password.length < 6) {
    throw new ValidationError('パスワードは6文字以上である必要があります')
  }
  
  if (password.length > 128) {
    throw new ValidationError('パスワードが長すぎます')
  }
  
  // パスワードの強度チェック（オプション）
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    throw new ValidationError('パスワードは大文字、小文字、数字を含む必要があります')
  }
}

// ユーザー名のバリデーション
export const validateUserName = (name: string): void => {
  if (!name || name.trim().length === 0) {
    throw new ValidationError('ユーザー名は必須です')
  }
  
  if (name.length < 2) {
    throw new ValidationError('ユーザー名は2文字以上で入力してください')
  }
  
  if (name.length > 50) {
    throw new ValidationError('ユーザー名は50文字以下で入力してください')
  }
  
  // 禁止文字のチェック
  const forbiddenChars = /[<>:"/\\|?*]/
  if (forbiddenChars.test(name)) {
    throw new ValidationError('ユーザー名に使用できない文字が含まれています')
  }
}

// 年齢のバリデーション
export const validateAge = (age: number): void => {
  if (age < 18) {
    throw new ValidationError('18歳以上である必要があります')
  }
  
  if (age > 100) {
    throw new ValidationError('年齢が無効です')
  }
}

// 性別のバリデーション
export const validateGender = (gender: number): void => {
  if (gender < 1 || gender > 3) {
    throw new ValidationError('性別は1-3の範囲で入力してください')
  }
}

// ログインリクエストのバリデーション
export const validateLoginRequest = (email: string, password: string): void => {
  validateEmail(email)
  validatePassword(password)
}

// サインアップリクエストのバリデーション
export const validateSignupRequest = (email: string, password: string, name: string): void => {
  validateEmail(email)
  validatePassword(password)
  validateUserName(name)
}

// 簡単ログインリクエストのバリデーション
export const validateSimpleLoginRequest = (email: string, password: string, name?: string): void => {
  validateEmail(email)
  validatePassword(password)
  
  if (name) {
    validateUserName(name)
  }
}

// プロフィール更新のバリデーション
export const validateProfileUpdate = (data: {
  name?: string
  age?: number
  gender?: number
}): void => {
  if (data.name !== undefined) {
    validateUserName(data.name)
  }
  
  if (data.age !== undefined) {
    validateAge(data.age)
  }
  
  if (data.gender !== undefined) {
    validateGender(data.gender)
  }
}

// パスワード変更のバリデーション
export const validatePasswordChange = (currentPassword: string, newPassword: string): void => {
  validatePassword(currentPassword)
  validatePassword(newPassword)
  
  if (currentPassword === newPassword) {
    throw new ValidationError('新しいパスワードは現在のパスワードと異なる必要があります')
  }
}

// パスワードリセットリクエストのバリデーション
export const validatePasswordResetRequest = (email: string): void => {
  validateEmail(email)
}

// パスワードリセットのバリデーション
export const validatePasswordReset = (token: string, newPassword: string): void => {
  if (!token || token.trim().length === 0) {
    throw new ValidationError('リセットトークンが必要です')
  }
  
  validatePassword(newPassword)
}
