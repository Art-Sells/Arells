import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, amount } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (typeof amount !== 'number') {
    return res.status(400).json({ error: 'Amount must be a number' });
  }

  const key = `${email}/aBTC.json`;

  try {
    // Directly set `aBTC` to the incoming `amount`
    const updatedABTC = parseFloat(amount.toFixed(2));

    // Save the updated `aBTC` value to S3
    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify({ aBTC: updatedABTC }),
        ContentType: 'application/json',
      })
      .promise();

    console.log(`Successfully set aBTC for ${email}:`, updatedABTC);

    return res.status(200).json({ message: 'aBTC set successfully', aBTC: updatedABTC });
  } catch (error: any) {
    console.error('Error updating aBTC.json:', error.message || error);
    return res.status(500).json({ error: 'Failed to update aBTC.json', details: error.message || error });
  }
};