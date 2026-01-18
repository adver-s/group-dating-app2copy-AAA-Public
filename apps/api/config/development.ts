export const developmentConfig = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dating_app',
    url: process.env.DATABASE_URL || 'mysql://admin:password@localhost:3306/dating_app'
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET_KEY || 'dev-secret-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    cognito: {
      userPoolId: process.env.COGNITO_USER_POOL_ID || 'ap-northeast-1_JTe906cJI',
      clientId: process.env.COGNITO_CLIENT_ID || 'fncti5mdsshnd1a1g964nmenn',
      identityPoolId: process.env.COGNITO_IDENTITY_POOL_ID || ''
    }
  },
  aws: {
    region: process.env.AWS_REGION || 'ap-northeast-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || '0.0.0.0'
  },
  meeting: {
    tabBackgrounds: {
      sent: '/assets/characters/alice.png',
      received: '/assets/characters/rabbit.png',
      hold: '/assets/characters/cat.png'
    }
  }
}; 