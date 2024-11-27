const AWS = require('aws-sdk');
require('dotenv').config(); // Load .env variables

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.NEXT_PUBLIC_WS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEXT_PUBLIC_WS_SECRET_ACCESS_KEY,
  region: process.env.NEXT_PUBLIC_WS_REGION,
});

const s3 = new AWS.S3();

/**
 * Creates an S3 file with the appropriate body content based on the file name.
 *
 * @param {string} email - The email to use for the folder structure in S3.
 * @param {string} fileName - The name of the file to create (default: 'vatop-data.json').
 */
const createS3Folder = async (email, fileName = 'vatop-data.json') => {
  const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;

  if (!bucketName) {
    console.error('S3 Bucket name is not defined in environment variables.');
    return;
  }

  const fileKey = `${email}/${fileName}`;

  // Define different file bodies based on the file name
  const fileBody = fileName === 'aBTC.json'
    ? JSON.stringify({ aBTC: 0 }) // Body for aBTC.json
    : JSON.stringify({ vatopGroups: [], vatopCombinations: {}, soldAmounts: 0, transactions: [] }); // Body for vatop-data.json

  const params = {
    Bucket: bucketName,
    Key: fileKey,
    Body: fileBody,
    ContentType: 'application/json',
    ACL: 'private', // Set ACL as required
  };

  try {
    await s3.putObject(params).promise();
  } catch (error) {
    console.error(`Error creating file: ${error.message}`);
  }
};

module.exports = { createS3Folder };