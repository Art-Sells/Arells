import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

// Calculate vavity combinations per VAPAA (token address)
const calculateVavityCombinations = (wallets: any[]) => {
  const combinationsByVapaa: Record<string, {
    acVatoc: number;
    acVact: number;
    acdVatoc: number;
    acVactTaa: number;
  }> = {};

  wallets.forEach((wallet) => {
    const vapaa = wallet.vapaa || '0x0000000000000000000000000000000000000000';
    
    if (!combinationsByVapaa[vapaa]) {
      combinationsByVapaa[vapaa] = {
        acVatoc: 0,
        acVact: 0,
        acdVatoc: 0,
        acVactTaa: 0,
      };
    }

    combinationsByVapaa[vapaa].acVatoc += wallet.cVatoc || 0;
    combinationsByVapaa[vapaa].acVact += wallet.cVact || 0;
    combinationsByVapaa[vapaa].acdVatoc += wallet.cdVatoc || 0;
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
        existingData = { wallets: [] };
      } else {
        throw err;
      }
    }

    // CRITICAL: Recalculate cVact and cVatoc for all wallets using correct formulas
    // cVact = cVactTaa * cpVact
    // cVatoc = cVactTaa * cpVatoc
    const validatedWallets = wallets.map((wallet: any) => {
      const cVactTaa = wallet.cVactTaa || 0;
      const cpVact = wallet.cpVact || 0;
      const cpVatoc = wallet.cpVatoc || cpVact; // Use cpVact as fallback if cpVatoc is missing
      
      // Recalculate using correct formulas
      const recalculatedCVact = cVactTaa * cpVact;
      const recalculatedCVatoc = cVactTaa * cpVatoc;
      const recalculatedCdVatoc = recalculatedCVact - recalculatedCVatoc;
      
      return {
        ...wallet,
        cVact: parseFloat(recalculatedCVact.toFixed(2)),
        cVatoc: parseFloat(recalculatedCVatoc.toFixed(2)),
        cdVatoc: parseFloat(recalculatedCdVatoc.toFixed(2)),
      };
    });
    
    // Always recalculate vavityCombinations from validated wallets to ensure accuracy
    // This ensures acdVatoc and other totals are always correct based on current wallet data
    const calculatedVavityCombinations = calculateVavityCombinations(validatedWallets);

    // ✅ REPLACE wallets with validated wallets (recalculated using correct formulas)
    const newData = {
      wallets: validatedWallets, // ← use validated wallets with correct calculations
      vavityCombinations: calculatedVavityCombinations,
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

