# AWS Infrastructure Provisioning Scripts

This directory contains Node.js scripts for provisioning AWS infrastructure for the group dating app.

## Overview

The provisioning system automates the creation of:
- AWS Secrets Manager entries for database credentials
- IAM roles and policies for EC2 instances
- S3 buckets for file storage
- Database tables and sample data
- JWT authentication tokens

## Prerequisites

1. **AWS Credentials**: Configure your AWS credentials with appropriate permissions
2. **Environment Variables**: Set up your `.env` file (see `env.example`)
3. **Node.js Dependencies**: Install required packages

## Setup

### 1. Environment Configuration

Copy the example environment file and configure your settings:

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

## Usage

### Command Line

Run the provisioning script directly:

```bash
npm run provision
```

### Web Interface

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/admin` in your browser

3. Click the "🚀 Start Provisioning" button

## Scripts Overview

### Core Scripts

- **`awsClient.js`**: AWS SDK client configurations
- **`secretsManagerClient.js`**: AWS Secrets Manager operations
- **`getDbSecrets.js`**: Retrieve database credentials from Secrets Manager
- **`connectAurora.js`**: Establish Aurora database connection
- **`authTokenGenerator.js`**: JWT token generation and verification

### IAM Scripts

- **`createIamRole.js`**: Create IAM roles for EC2 instances
- **`createManagedPolicy.js`**: Create managed policies
- **`attachPolicyToRole.js`**: Attach policies to IAM roles
- **`attachRoleToEc2.js`**: Attach IAM roles to EC2 instances

### Storage Scripts

- **`createS3Bucket.js`**: Create S3 buckets for file storage

### Database Scripts

- **`createUserTable.js`**: Create database tables
- **`testConnection.js`**: Test database connectivity
- **`runAuroraQuery.js`**: Execute custom database queries

### Orchestration

- **`index.js`**: Main orchestrator that coordinates all provisioning steps

## Provisioning Steps

The orchestrator executes the following steps in order:

1. **Create Database Secrets**: Store database credentials in AWS Secrets Manager
2. **Create IAM Role**: Create EC2 instance role
3. **Create Managed Policy**: Create custom policy for app permissions
4. **Attach Policies to Role**: Attach policies to the IAM role
5. **Create S3 Buckets**: Create storage buckets for user avatars, team photos, and chat media
6. **Test Database Connection**: Verify connectivity to Aurora database
7. **Create Database Tables**: Create all required database tables
8. **Insert Sample Data**: Add sample users and teams
9. **Generate Test Tokens**: Create JWT tokens for testing

## Database Schema

The provisioning creates the following tables:

- **`users`**: User profiles and authentication
- **`teams`**: Group information
- **`team_members`**: Team membership and roles
- **`matches`**: Team matching and status
- **`chat_rooms`**: Chat room management
- **`messages`**: Chat message storage

## S3 Buckets

The following S3 buckets are created:

- `dating-app-user-avatars`: User profile pictures
- `dating-app-team-photos`: Team photos
- `dating-app-chat-media`: Chat media files

## Security Features

- **Secrets Management**: Database credentials stored securely in AWS Secrets Manager
- **IAM Roles**: Least privilege access for EC2 instances
- **S3 Security**: Public access blocked, versioning enabled
- **JWT Authentication**: Secure token-based authentication

## Troubleshooting

### Common Issues

1. **AWS Credentials**: Ensure your AWS credentials have sufficient permissions
2. **Database Connection**: Verify Aurora cluster endpoint and credentials
3. **Network Access**: Ensure your application can reach AWS services
4. **Environment Variables**: Check that all required variables are set

### Error Handling

The scripts include comprehensive error handling:
- Graceful handling of existing resources
- Detailed error messages
- Step-by-step progress reporting
- Timeout protection (5 minutes)

### Logs

All provisioning steps are logged with emoji indicators:
- ✅ Success
- ❌ Error
- ⚠️ Warning
- 📋 Information

## Development

### Adding New Scripts

1. Create your script in the `infra/scripts/` directory
2. Export your functions
3. Import and add to the orchestrator in `index.js`

### Testing

Test individual components:

```bash
# Test database connection
node infra/scripts/testConnection.js

# Test query execution
node infra/scripts/runAuroraQuery.js

# Generate test tokens
node -e "console.log(require('./infra/scripts/authTokenGenerator.js').generateUserToken('test-user'))"
```

## Production Considerations

1. **Security**: Change default JWT secret key
2. **Monitoring**: Set up CloudWatch alarms
3. **Backup**: Configure automated database backups
4. **Scaling**: Consider auto-scaling groups for EC2 instances
5. **Cost Optimization**: Use appropriate instance types and storage classes

## Support

For issues or questions:
1. Check the logs for detailed error messages
2. Verify AWS credentials and permissions
3. Test individual components
4. Review the troubleshooting section above 