import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, vatopGroups, vatopCombinations, soldAmounts, acVactTas, transactions } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  let currentVatopCombinations = vatopCombinations || {};
  let currentSoldAmounts = 0;

  try {
    // Fetch existing data from S3 if vatopCombinations or soldAmounts are not provided
    const key = `${email}/vatop-data.json`;
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

    if (!vatopCombinations) {
      currentVatopCombinations = existingData.vatopCombinations || {};
    }

    // Reset or add to the existing sold amounts
    if (soldAmounts === 0) {
      console.log('Resetting currentSoldAmounts to zero');
      currentSoldAmounts = 0;
    } else if (soldAmounts !== undefined) {
      console.log('Adding soldAmounts:', soldAmounts, 'to currentSoldAmounts:', existingData.soldAmounts || 0);
      currentSoldAmounts = (existingData.soldAmounts || 0) + soldAmounts;
    } else {
      currentSoldAmounts = existingData.soldAmounts || 0;
    }

    // Update only the acVactTas field if provided
    if (acVactTas !== undefined) {
      currentVatopCombinations.acVactTas = acVactTas;
    }

    // Prepare the data to be saved in S3
    const newData = {
      vatopGroups: vatopGroups || existingData.vatopGroups || [],
      vatopCombinations: currentVatopCombinations,
      soldAmounts: currentSoldAmounts,
      transactions: transactions || existingData.transactions || [],
    };

    // Upload to S3
    await s3.putObject({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(newData),
      ContentType: 'application/json',
      ACL: 'private',
    }).promise();

    return res.status(200).json({ message: 'Data saved successfully' });
  } catch (error) {
    const errorMessage = (error as Error).message || 'Failed to save data';
    console.error('Error saving data:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
};

export default handler;