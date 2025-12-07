import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, vatopCombinations, vatopGroups } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  try {
    const key = `${email}/vatop-data.json`;

    // Fetch existing data from S3
    let existingData: any = {};
    try {
      const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
      existingData = JSON.parse(data.Body!.toString());
    } catch (err: any) {
      if (err.code === 'NoSuchKey') {
        console.warn("⚠️ No existing data found for user:", email);
        existingData = { vatopGroups: [], vatopCombinations: {}, soldAmounts: 0, transactions: [] };
      } else {
        throw err;
      }
    }

    // ✅ REPLACE vatopGroups with latest from frontend
    const newData = {
      vatopGroups, // ← trust the incoming frontend data
      vatopCombinations,
      soldAmounts: existingData.soldAmounts ?? 0,
      transactions: existingData.transactions ?? [],
    };

    // Save the updated data back to S3
    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(newData),
        ContentType: 'application/json',
        ACL: 'private',
      })
      .promise();

    return res.status(200).json({ message: 'Data saved successfully', data: newData });
  } catch (error) {
    console.error('❌ Error during processing:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;

