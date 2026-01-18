// エラーハンドリング関連のエクスポート

export {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  DatabaseError,
  ExternalApiError,
  RateLimitError,
  ErrorHandler,
  createError,
  validateRequired,
  validateEmail,
  validatePassword,
  validateStringLength,
  validateNumberRange,
  requireAuth,
  requireAdmin
} from './ErrorHandler'

// 既存のエラークラスも再エクスポート
export { AppError as AppErrorClass } from './AppError'
export { AuthenticationError as AuthenticationErrorClass } from './AuthenticationError'
export { DatabaseError as DatabaseErrorClass } from './DatabaseError'
export { ValidationError as ValidationErrorClass } from './ValidationError'
export { NotFoundError as NotFoundErrorClass } from './NotFoundError'