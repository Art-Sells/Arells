import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, bankAccount } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  try {
    const key = `${email}/bank-account.json`;
    const newData = { bankAccount: bankAccount || 'NO' };

    await s3.putObject({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(newData),
      ContentType: 'application/json',
      ACL: 'private',
    }).promise();

    return res.status(200).json({ message: 'Bank account status updated successfully' });
  } catch (error) {
    const errorMessage = (error as Error).message || 'Failed to update bank account status';
    console.error('Error updating bank account status:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
};

export default handler;