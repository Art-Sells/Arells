// pages/api/saveBTC.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;

export default async function saveBTC(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { BTCaddress, BTCkey, email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const key = `${email}/BTCwallet.json`;

  try {
    await s3.headObject({ Bucket: BUCKET_NAME, Key: key }).promise();
    return res.status(200).json({ message: 'File already exists, skipping creation' });
  } catch (error: any) {
    if (error.code === 'NotFound') {
      await s3
        .putObject({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: JSON.stringify({ BTCaddress, BTCkey }),
          ContentType: 'application/json',
        })
        .promise();
      return res.status(201).json({ message: 'BTC Wallet saved successfully' });
    } else {
      console.error('Error accessing S3:', error);
      return res.status(500).json({ error: 'Failed to access S3', details: error.message });
    }
  }
}