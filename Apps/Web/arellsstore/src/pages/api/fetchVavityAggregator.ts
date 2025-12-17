import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email query parameter is required' });
  }

  const key = `${email}/VavityAggregate.json`;

  try {
    const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
    const userData = JSON.parse(data.Body!.toString());

    return res.status(200).json(userData);
  } catch (error: any) {
    // If the file doesn't exist, return empty data structure
    if (error.code === 'NoSuchKey' || error.statusCode === 404) {
      console.log('No existing data found for user:', email, '- returning empty structure');
      return res.status(200).json({
        wallets: [],
        vavityCombinations: {}, // Empty object - will be keyed by VAPAA
        vapa: 0,
      });
    }
    
    const errorMessage = error.message || 'Could not fetch user data';
    console.error('Error fetching data:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
};

