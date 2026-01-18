# AWS Infrastructure Provisioning Setup

## 🎯 Overview

This guide explains how to set up and use the AWS infrastructure provisioning system for your group dating app. The system provides a one-click solution to provision all necessary AWS resources and initialize your database.

## 📁 Project Structure

```
group-dating-app2のコピー/
├── infra/
│   ├── scripts/
│   │   ├── awsClient.js              # AWS SDK clients
│   │   ├── secretsManagerClient.js    # Secrets Manager operations
│   │   ├── getDbSecrets.js           # Database secrets retrieval
│   │   ├── connectAurora.js          # Aurora database connection
│   │   ├── authTokenGenerator.js     # JWT token generation
│   │   ├── createIamRole.js          # IAM role creation
│   │   ├── createManagedPolicy.js    # Managed policy creation
│   │   ├── attachPolicyToRole.js     # Policy attachment
│   │   ├── attachRoleToEc2.js        # EC2 role attachment
│   │   ├── createS3Bucket.js         # S3 bucket creation
│   │   ├── createUserTable.js        # Database table creation
│   │   ├── testConnection.js         # Database connection testing
│   │   ├── runAuroraQuery.js         # Custom query execution
│   │   └── index.js                  # Main orchestrator
│   └── README.md                     # Detailed documentation
├── components/
│   └── ProvisionButton.jsx           # Frontend provisioning button
├── app/
│   ├── api/
│   │   └── provision/
│   │       └── route.ts              # API endpoint for provisioning
│   └── admin/
│       └── page.tsx                  # Admin dashboard page
├── package.json                      # Updated with new dependencies
├── env.example                       # Environment variables template
└── PROVISIONING_SETUP.md            # This file
```

## 🚀 Quick Start

### 1. Environment Setup

Copy the environment template and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your actual values:

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1

# Database Configuration
DB_HOST=your-aurora-cluster-endpoint
DB_PORT=3306
DB_USERNAME=admin
DB_PASSWORD=your-secure-password
DB_NAME=dating_app

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Provisioning

#### Option A: Command Line
```bash
npm run provision
```

#### Option B: Web Interface
1. Start the development server:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:3000/admin`
3. Click the "🚀 Start Provisioning" button

## 🔧 What Gets Created

### AWS Resources
- **Secrets Manager**: Database credentials storage
- **IAM Roles**: EC2 instance permissions
- **S3 Buckets**: File storage for avatars, photos, and media
- **Managed Policies**: Custom permissions for the app

### Database Tables
- `users`: User profiles and authentication
- `teams`: Group information
- `team_members`: Team membership and roles
- `matches`: Team matching and status
- `chat_rooms`: Chat room management
- `messages`: Chat message storage

### Sample Data
- 4 sample users with different locations
- 4 sample teams with descriptions
- Team member relationships
- JWT authentication tokens

## 📊 Provisioning Steps

The system executes these steps in order:

1. **Create Database Secrets** → Store credentials in AWS Secrets Manager
2. **Create IAM Role** → Set up EC2 instance permissions
3. **Create Managed Policy** → Define custom app permissions
4. **Attach Policies to Role** → Apply permissions to the role
5. **Create S3 Buckets** → Set up file storage
6. **Test Database Connection** → Verify Aurora connectivity
7. **Create Database Tables** → Initialize database schema
8. **Insert Sample Data** → Add test users and teams
9. **Generate Test Tokens** → Create JWT tokens for testing

## 🛡️ Security Features

- **Secrets Management**: Database credentials stored securely
- **IAM Least Privilege**: Minimal required permissions
- **S3 Security**: Public access blocked, versioning enabled
- **JWT Authentication**: Secure token-based auth
- **Error Handling**: Comprehensive error management

## 🔍 Monitoring & Logs

### Real-time Progress
The system provides real-time feedback with emoji indicators:
- ✅ Success
- ❌ Error  
- ⚠️ Warning
- 📋 Information

### Web Interface Features
- Live progress updates
- Streaming logs display
- Error handling and recovery
- Timeout protection (5 minutes)

## 🐛 Troubleshooting

### Common Issues

1. **AWS Credentials**
   - Ensure credentials have sufficient permissions
   - Check AWS region configuration
   - Verify access key and secret key

2. **Database Connection**
   - Verify Aurora cluster endpoint
   - Check database credentials
   - Ensure network connectivity

3. **Environment Variables**
   - All required variables must be set
   - Check `.env` file format
   - Verify no extra spaces or quotes

### Error Recovery

The system includes:
- Graceful handling of existing resources
- Detailed error messages
- Step-by-step progress reporting
- Automatic timeout protection

## 🔄 Development Workflow

### Adding New Features

1. **Create Script**: Add new script to `infra/scripts/`
2. **Export Functions**: Export your functions
3. **Update Orchestrator**: Add to `index.js` orchestrator
4. **Test**: Run individual script tests
5. **Deploy**: Test with full provisioning

### Testing Individual Components

```bash
# Test database connection
node infra/scripts/testConnection.js

# Test query execution
node infra/scripts/runAuroraQuery.js

# Generate test tokens
node -e "console.log(require('./infra/scripts/authTokenGenerator.js').generateUserToken('test-user'))"
```

## 📈 Production Considerations

### Security
- Change default JWT secret key
- Use strong database passwords
- Enable AWS CloudTrail logging
- Set up IAM user rotation

### Monitoring
- Configure CloudWatch alarms
- Set up database monitoring
- Monitor S3 bucket usage
- Track API usage

### Backup & Recovery
- Enable automated database backups
- Set up S3 bucket versioning
- Configure cross-region replication
- Test disaster recovery procedures

### Cost Optimization
- Use appropriate instance types
- Enable S3 lifecycle policies
- Monitor and optimize usage
- Set up billing alerts

## 📚 Additional Resources

- [AWS SDK Documentation](https://docs.aws.amazon.com/sdk-for-javascript/)
- [Aurora MySQL Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [S3 Security Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)

## 🆘 Support

For issues or questions:

1. Check the logs for detailed error messages
2. Verify AWS credentials and permissions
3. Test individual components
4. Review the troubleshooting section
5. Check the `infra/README.md` for detailed documentation

---

**Happy Provisioning! 🚀** 