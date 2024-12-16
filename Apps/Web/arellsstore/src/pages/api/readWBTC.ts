// pages/api/readWBTC.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.query as { email: string };

  if (!email) {
    return res.status(400).json({ error: 'Email query parameter is required' });
  }

  const key = `${email}/WBTCwallet.json`;

  try {
    const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
    if (response.Body) {
      const walletData = JSON.parse(response.Body.toString());
      return res.status(200).json(walletData);
    } else {
      return res.status(404).json({ error: 'WBTC Wallet not found' });
    }
  } catch (error: any) {
    if (error.code === 'NoSuchKey') {
      return res.status(404).json({ error: 'WBTC Wallet not found' });
    }
    console.error('Error fetching WBTC Wallet data:', error);
    return res.status(500).json({ error: 'Error fetching WBTC Wallet data', details: error.message });
  }
};