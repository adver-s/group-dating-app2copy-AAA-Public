const { s3Client } = require('./awsClient');

async function createS3Bucket(bucketName, region = 'us-east-1') {
  const { CreateBucketCommand, PutBucketVersioningCommand, PutPublicAccessBlockCommand } = require('@aws-sdk/client-s3');
  
  try {
    // Create the bucket
    const createBucketCommand = new CreateBucketCommand({
      Bucket: bucketName,
      CreateBucketConfiguration: {
        LocationConstraint: region === 'us-east-1' ? undefined : region
      }
    });

    await s3Client.send(createBucketCommand);
    console.log(`✅ S3 bucket '${bucketName}' created successfully`);

    // Enable versioning
    const versioningCommand = new PutBucketVersioningCommand({
      Bucket: bucketName,
      VersioningConfiguration: {
        Status: 'Enabled'
      }
    });

    await s3Client.send(versioningCommand);
    console.log(`✅ Versioning enabled for bucket '${bucketName}'`);

    // Configure public access block
    const publicAccessCommand = new PutPublicAccessBlockCommand({
      Bucket: bucketName,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: true,
        RestrictPublicBuckets: true
      }
    });

    await s3Client.send(publicAccessCommand);
    console.log(`✅ Public access blocked for bucket '${bucketName}'`);

    return bucketName;
  } catch (error) {
    if (error.name === 'BucketAlreadyExists') {
      console.log(`⚠️ S3 bucket '${bucketName}' already exists`);
      return bucketName;
    }
    console.error(`❌ Error creating S3 bucket '${bucketName}':`, error.message);
    throw error;
  }
}

async function createDatingAppBuckets() {
  const buckets = [
    'dating-app-user-avatars',
    'dating-app-team-photos',
    'dating-app-chat-media'
  ];

  const createdBuckets = [];
  
  for (const bucketName of buckets) {
    try {
      const bucket = await createS3Bucket(bucketName);
      createdBuckets.push(bucket);
    } catch (error) {
      console.error(`Failed to create bucket ${bucketName}:`, error.message);
    }
  }

  return createdBuckets;
}

module.exports = {
  createS3Bucket,
  createDatingAppBuckets
}; 