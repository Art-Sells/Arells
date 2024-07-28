import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }
  
  const key = `${email}/bank-account.json`;
  
  try {
    const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
    const bankAccountData = JSON.parse(data.Body!.toString());
  
    return res.status(200).json(bankAccountData);
  } catch (error: any) {
    console.error('Error fetching bank account:', error);
    const errorMessage = (error as Error).message || 'Failed to fetch bank account';
    return res.status(500).json({ error: errorMessage });
  }
};

export default handler;