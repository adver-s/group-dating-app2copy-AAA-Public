// グローバル型定義

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // データベース
      DATABASE_URL: string
      DB_HOST?: string
      DB_PORT?: string
      DB_USERNAME?: string
      DB_PASSWORD?: string
      DB_NAME?: string

      // JWT
      JWT_SECRET_KEY: string
      JWT_EXPIRES_IN?: string

      // AWS
      AWS_ACCESS_KEY_ID: string
      AWS_SECRET_ACCESS_KEY: string
      AWS_REGION: string
      S3_BUCKET_NAME?: string
      S3_REGION?: string

      // アプリケーション
      NEXT_PUBLIC_APP_URL: string
      NEXT_PUBLIC_API_URL: string
      NEXT_PUBLIC_BASE_URL: string
      NODE_ENV: 'development' | 'staging' | 'production'

      // AWS Chime
      CHIME_REGION?: string
      CHIME_MEETING_REGION?: string

      // 管理者
      ADMIN_EMAIL?: string
      ADMIN_PASSWORD?: string

      // メール
      SMTP_HOST?: string
      SMTP_PORT?: string
      SMTP_USER?: string
      SMTP_PASS?: string

      // レート制限
      RATE_LIMIT_MAX?: string
      RATE_LIMIT_WINDOW?: string

      // ログ
      LOG_LEVEL?: string
      LOG_FILE?: string

      // セキュリティ
      CORS_ORIGIN?: string
      TRUSTED_PROXY?: string

      // 開発用
      DEBUG?: string
      VERBOSE_LOGGING?: string
    }
  }
}

export {}
