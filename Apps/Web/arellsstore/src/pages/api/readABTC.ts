import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email query parameter is required' });
  }

  const key = `${email}/aBTC.json`;

  try {
    const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
    const aBTCData = JSON.parse(data.Body!.toString());

    return res.status(200).json(aBTCData);
  } catch (error: any) {
    if (error.code === 'NoSuchKey') {
      console.warn('aBTC.json not found. Returning 0.');
      return res.status(200).json({ aBTC: 0 });
    }

    const errorMessage = error.message || 'Error fetching aBTC.json';
    console.error('Error fetching aBTC.json:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
};