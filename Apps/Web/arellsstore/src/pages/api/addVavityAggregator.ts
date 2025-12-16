import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

const calculateVavityCombinations = (wallets: any[]) => {
  return wallets.reduce(
    (acc, wallet) => {
      acc.acVatoi += wallet.cVatoi || 0;
      acc.acVacts += wallet.cVact || 0;
      acc.acdVatoi += wallet.cdVatoi || 0;
      acc.acVactTaa += wallet.cVactTaa || 0;
      return acc;
    },
    {
      acVatoi: 0,
      acVacts: 0,
      acdVatoi: 0,
      acVactTaa: 0,
    }
  );
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, newWallets } = req.body;

  if (!email || !Array.isArray(newWallets) || newWallets.length === 0) {
    console.error("Invalid request data:", { email, newWallets });
    return res.status(400).json({ error: 'Invalid request: Missing email or newWallets' });
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
        console.warn("No existing data found for user:", email);
      } else {
        throw err;
      }
    }

    const existingWallets = Array.isArray(existingData.wallets) ? existingData.wallets : [];

    // Filter out wallets with duplicate IDs OR duplicate addresses
    const validNewWallets = newWallets.filter((wallet: any) => {
      if (!wallet.walletId || !wallet.address) {
        return false; // Skip wallets without required fields
      }
      
      // Check for duplicate walletId
      const hasDuplicateId = existingWallets.some((existingWallet: any) => existingWallet.walletId === wallet.walletId);
      if (hasDuplicateId) {
        console.log(`Skipping wallet with duplicate ID: ${wallet.walletId}`);
        return false;
      }
      
      // Check for duplicate address (case-insensitive)
      const hasDuplicateAddress = existingWallets.some((existingWallet: any) => 
        existingWallet.address?.toLowerCase() === wallet.address?.toLowerCase()
      );
      if (hasDuplicateAddress) {
        console.log(`Skipping wallet with duplicate address: ${wallet.address}`);
        return false;
      }
      
      return true;
    });

    if (validNewWallets.length === 0) {
      return res.status(400).json({ error: 'No valid wallets to add - all wallets are duplicates' });
    }

    const updatedWallets = [...existingWallets, ...validNewWallets];

    // Calculate new vavity combinations
    const updatedVavityCombinations = calculateVavityCombinations(updatedWallets);

    // Calculate VAPA (highest asset price recorded always)
    const allCpVacts = updatedWallets.map((w: any) => w.cpVact || 0);
    const vapa = Math.max(...allCpVacts, existingData.vapa || 0);

    const newData = {
      ...existingData,
      wallets: updatedWallets,
      vavityCombinations: updatedVavityCombinations,
      vapa: vapa,
    };

    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(newData),
        ContentType: 'application/json',
        ACL: 'private',
      })
      .promise();

    return res.status(200).json({ 
      message: 'New groups added successfully', 
      data: newData 
    });
  } catch (error) {
    console.error('Error during processing:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;

