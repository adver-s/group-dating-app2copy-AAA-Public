/** @type {import('next').NextConfig} */
const nextConfig = {
  // 開発環境ではスタンドアロン出力を無効化
  ...(process.env.NODE_ENV === 'development' ? {} : { output: 'standalone' }),

  // 画像最適化の設定
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // 環境変数の設定
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // サーバーコンポーネントの最適化
  serverExternalPackages: ['mysql2'],

  // 開発環境での追加設定
  ...(process.env.NODE_ENV === 'development' ? {
    // 開発環境では画像最適化を無効化
    images: {
      unoptimized: true,
    },
  } : {}),

  // ヘッダー設定（CORS対策）
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
  // /uploads/* を 画像配信API に転送
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/images/uploads/:path*',
      },
    ]
  },
}

module.exports = nextConfig 