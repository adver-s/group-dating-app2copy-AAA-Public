const jwt = require('jsonwebtoken');

class AuthTokenGenerator {
  constructor() {
    this.secretKey = process.env.JWT_SECRET_KEY || 'your-secret-key';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  generateToken(payload) {
    try {
      const token = jwt.sign(payload, this.secretKey, {
        expiresIn: this.expiresIn,
        issuer: 'dating-app',
        audience: 'dating-app-users'
      });
      
      console.log('✅ JWT token generated successfully');
      return token;
    } catch (error) {
      console.error('❌ Error generating JWT token:', error.message);
      throw error;
    }
  }

  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.secretKey);
      console.log('✅ JWT token verified successfully');
      return decoded;
    } catch (error) {
      console.error('❌ Error verifying JWT token:', error.message);
      throw error;
    }
  }

  generateUserToken(userId, userRole = 'user') {
    const payload = {
      userId,
      userRole,
      timestamp: Date.now()
    };
    
    return this.generateToken(payload);
  }

  generateAdminToken(adminId) {
    const payload = {
      adminId,
      userRole: 'admin',
      timestamp: Date.now()
    };
    
    return this.generateToken(payload);
  }
}

module.exports = new AuthTokenGenerator(); 