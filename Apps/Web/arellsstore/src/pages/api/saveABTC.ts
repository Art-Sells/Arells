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
    let existingData: any = { aBTC: 0 };

    // Fetch the existing data from S3
    try {
      const data = await s3
        .getObject({ Bucket: BUCKET_NAME, Key: key })
        .promise();
      existingData = JSON.parse(data.Body!.toString());
    } catch (err: any) {
      if (err.code === 'NoSuchKey') {
        console.warn(`No existing aBTC file found for ${email}. Creating a new one.`);
      } else {
        console.error('Error reading from S3:', err.message || err);
        throw err;
      }
    }

    // Calculate the updated aBTC value, ensuring it doesn't go below 0
    const updatedABTC = parseFloat(
      Math.max((existingData.aBTC || 0) + parseFloat(amount.toFixed(8)), 0).toFixed(8)
    );

    // Save the updated aBTC value back to S3
    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify({ aBTC: updatedABTC }),
        ContentType: 'application/json',
      })
      .promise();

    console.log(`Successfully updated aBTC for ${email}:`, updatedABTC);

    return res.status(200).json({ message: 'aBTC updated successfully', aBTC: updatedABTC });
  } catch (error: any) {
    console.error('Error updating aBTC.json:', error.message || error);
    return res.status(500).json({ error: 'Failed to update aBTC.json', details: error.message || error });
  }
};