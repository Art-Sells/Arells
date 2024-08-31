// aws-config.js

const AWS = require('aws-sdk');
require('dotenv').config(); // Load .env variables

// Add console.logs to check if environment variables are loaded
console.log('AWS Access Key ID:', process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID ? 'Loaded' : 'Not Set');
console.log('AWS Secret Access Key:', process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY ? 'Loaded' : 'Not Set');
console.log('AWS Region:', process.env.NEXT_PUBLIC_AWS_REGION ? process.env.NEXT_PUBLIC_AWS_REGION : 'Not Set');
console.log('S3 Bucket Name:', process.env.NEXT_PUBLIC_S3_BUCKET_NAME ? process.env.NEXT_PUBLIC_S3_BUCKET_NAME : 'Not Set');

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
  region: process.env.NEXT_PUBLIC_AWS_REGION,
});

const s3 = new AWS.S3();

const createS3Folder = async (email) => {
  const folderKey = `${email}/vatop-data.json`; // Define the key for the JSON file

  const params = {
    Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
    Key: folderKey,
    Body: JSON.stringify({ vatopGroups: [], vatopCombinations: {}, soldAmounts: 0, transactions: [] }),
    ContentType: 'application/json',
    ACL: 'private', // Set ACL as required
  };

  try {
    console.log(`Creating folder and file with params: ${JSON.stringify(params)}`);
    await s3.putObject(params).promise();
    console.log(`Folder and file created successfully: ${folderKey}`);
  } catch (error) {
    console.error(`Error creating folder and file: ${error.message}`);
  }
};

module.exports = { createS3Folder };
