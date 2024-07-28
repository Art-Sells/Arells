import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, bankAccount } = req.body;

  if (!email || !bankAccount) {
    return res.status(400).json({ error: 'Missing email or bank account' });
  }

  const key = `${email}/bank-account.json`;

  try {
    // Fetch existing data from S3
    let existingData: any = {};
    try {
      const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
      existingData = JSON.parse(data.Body!.toString());
    } catch (err: any) {
      if (err.code !== 'NoSuchKey') {
        throw err; // Re-throw unexpected errors
      }
      // No existing data found, proceed with default empty values
    }

    // Prepare the data to be saved in S3
    const newData = {
      ...existingData,
      bankAccount,
    };

    // Upload to S3
    await s3.putObject({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(newData),
      ContentType: 'application/json',
      ACL: 'private',
    }).promise();

    return res.status(200).json({ message: 'Bank account updated successfully' });
  } catch (error: any) {
    console.error('Error updating bank account:', error);
    const errorMessage = error.message || 'Failed to update bank account';
    return res.status(500).json({ error: errorMessage });
  }
};

export default handler;