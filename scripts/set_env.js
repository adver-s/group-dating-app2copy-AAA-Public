const fs = require('fs');
const path = require('path');

// 環境変数の内容
const envContent = `# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=ap-northeast-1

# Database Configuration (AWS Aurora)
DB_HOST=dating-app-cluster.cluster-c7m0swiq43ob.ap-northeast-1.rds.amazonaws.com
DB_PORT=3306
DB_USERNAME=admin
DB_PASSWORD=your-secure-password
DB_NAME=dating_app

# Prisma Database URL
DATABASE_URL="mysql://admin:your-secure-password@dating-app-cluster.cluster-c7m0swiq43ob.ap-northeast-1.rds.amazonaws.com:3306/dating_app"

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Cognito Configuration
COGNITO_USER_POOL_ID=your-cognito-user-pool-id
COGNITO_CLIENT_ID=your-cognito-client-id
COGNITO_IDENTITY_POOL_ID=your-cognito-identity-pool-id

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api 
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Amazon Chime SDK Configuration
CHIME_SQS_QUEUE_ARN=arn:aws:sqs:region:account:queue-name

# Environment
NODE_ENV=development
`;

// .envファイルを作成
const envPath = path.join(__dirname, '..', '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .envファイルが作成されました:', envPath);
  console.log('⚠️  パスワードを実際の値に変更してください');
} catch (error) {
  console.error('❌ .envファイルの作成に失敗しました:', error);
}
