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

  const key = `${email}/aBTC.json`;

  try {
    let existingData: any = { aBTC: 0 };

    try {
      const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
      existingData = JSON.parse(data.Body!.toString());
    } catch (err: any) {
      if (err.code !== 'NoSuchKey') {
        throw err;
      }
    }

    const updatedABTC = (existingData.aBTC || 0) + amount;

    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify({ aBTC: updatedABTC }),
        ContentType: 'application/json',
      })
      .promise();

    return res.status(200).json({ message: 'aBTC updated successfully', aBTC: updatedABTC });
  } catch (error: any) {
    const errorMessage = error.message || 'Failed to update aBTC.json';
    console.error('Error updating aBTC.json:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
};