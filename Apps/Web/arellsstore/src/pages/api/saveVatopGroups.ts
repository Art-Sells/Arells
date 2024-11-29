import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, vatopGroups, vatopCombinations, acVactTas, soldAmounts, transactions } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  let currentVatopCombinations = vatopCombinations || {};

  try {
    const key = `${email}/vatop-data.json`;
    let existingData: any = {};

    // Fetch existing data from S3
    try {
      const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
      existingData = JSON.parse(data.Body!.toString());
    } catch (err: any) {
      if (err.code !== 'NoSuchKey') {
        throw err;
      }
    }

    // Use existing combinations if not provided
    if (!vatopCombinations) {
      currentVatopCombinations = existingData.vatopCombinations || {};
    }

    // Update combinations if acVactTas is provided
    if (acVactTas !== undefined) {
      currentVatopCombinations.acVactTas = acVactTas;
    }

    // Prepare the new data
    const newData = {
      vatopGroups: vatopGroups || existingData.vatopGroups || [],
      vatopCombinations: currentVatopCombinations,
      soldAmounts: soldAmounts !== undefined ? soldAmounts : existingData.soldAmounts || 0,
      transactions: transactions || existingData.transactions || [],
    };

    // Save the updated data to S3
    await s3.putObject({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(newData),
      ContentType: 'application/json',
      ACL: 'private',
    }).promise();

    return res.status(200).json({ message: 'Data saved successfully', data: newData });
  } catch (error) {
    const errorMessage = (error as Error).message || 'Failed to save data';
    console.error('Error saving data:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
};

export default handler;