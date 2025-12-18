import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

// Calculate vavity combinations per VAPAA (token address)
const calculateVavityCombinations = (wallets: any[]) => {
  const combinationsByVapaa: Record<string, {
    acVatoi: number;
    acVact: number;
    acdVatoi: number;
    acVactTaa: number;
  }> = {};

  wallets.forEach((wallet) => {
    const vapaa = wallet.vapaa || '0x0000000000000000000000000000000000000000';
    
    if (!combinationsByVapaa[vapaa]) {
      combinationsByVapaa[vapaa] = {
        acVatoi: 0,
        acVact: 0,
        acdVatoi: 0,
        acVactTaa: 0,
      };
    }

    combinationsByVapaa[vapaa].acVatoi += wallet.cVatoi || 0;
    combinationsByVapaa[vapaa].acVact += wallet.cVact || 0;
    combinationsByVapaa[vapaa].acdVatoi += wallet.cdVatoi || 0;
    combinationsByVapaa[vapaa].acVactTaa += wallet.cVactTaa || 0;
  });

  return combinationsByVapaa;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, vavityCombinations, wallets } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  try {
    const key = `${email}/VavityAggregate.json`;

    // Fetch existing data from S3
    let existingData: any = {};
    try {
      const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
      existingData = JSON.parse(data.Body!.toString());
    } catch (err: any) {
      if (err.code === 'NoSuchKey') {
        console.warn("⚠️ No existing data found for user:", email);
        existingData = { wallets: [], vapa: 0, soldAmounts: 0, transactions: [] };
      } else {
        throw err;
      }
    }

    // Recalculate vavityCombinations from wallets if not provided or if wallets structure changed
    const calculatedVavityCombinations = vavityCombinations || calculateVavityCombinations(wallets);

    // ✅ REPLACE wallets with latest from frontend
    const newData = {
      wallets, // ← trust the incoming frontend data
      vavityCombinations: calculatedVavityCombinations,
      vapa: existingData.vapa ?? 0,
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

