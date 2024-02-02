import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import 'dotenv/config';

// Configure AWS SDK
AWS.config.update({
  region: 'us-west-1', // Replace with your desired AWS region
  credentials: {
    accessKeyId: process.env.API_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.API_SECRET_ACCESS_KEY || '',
  },
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();

