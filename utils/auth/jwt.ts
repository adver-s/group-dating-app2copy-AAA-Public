import jwt from 'jsonwebtoken';

// 簡単なJWTシークレット（本番では環境変数から取得）
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'local-dev-secret-key';

export interface JWTPayload {
  sub: string;
  userId: string;
  email: string;
  name: string;
  ageVerified?: boolean;
  accountId?: string;
  iat: number;
  exp: number;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('❌ JWT verification failed:', error);
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('❌ JWT decode failed:', error);
    return null;
  }
}
