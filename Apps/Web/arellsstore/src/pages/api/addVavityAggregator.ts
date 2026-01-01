import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

// Calculate vavity combinations per VAPAA (token address)
// Returns an object keyed by VAPAA, each containing totals for that token
const calculateVavityCombinations = (wallets: any[]) => {
  const combinationsByVapaa: Record<string, {
    acVatoc: number;
    acVact: number;
    acdVatoc: number;
    acVactTaa: number;
  }> = {};

  wallets.forEach((wallet) => {
    // Use VAPAA (token address) as the key, default to native ETH if not provided
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
      
      // Ensure VAPAA is set (default to native ETH if not provided)
      if (!wallet.vapaa) {
        wallet.vapaa = '0x0000000000000000000000000000000000000000';
      }
      
      // Ensure depositPaid is set (default to false if not provided)
      if (wallet.depositPaid === undefined) {
        wallet.depositPaid = false;
      }
      
      // Check for duplicate walletId
      const hasDuplicateId = existingWallets.some((existingWallet: any) => existingWallet.walletId === wallet.walletId);
      if (hasDuplicateId) {
        console.log(`Skipping wallet with duplicate ID: ${wallet.walletId}`);
        return false;
      }
      
      // Check for duplicate address (case-insensitive) AND same VAPAA
      // Allow same address with different VAPAA (different tokens)
      const hasDuplicateAddress = existingWallets.some((existingWallet: any) => {
        const existingVapaa = existingWallet.vapaa || '0x0000000000000000000000000000000000000000';
        const newVapaa = wallet.vapaa || '0x0000000000000000000000000000000000000000';
        return existingWallet.address?.toLowerCase() === wallet.address?.toLowerCase() &&
               existingVapaa.toLowerCase() === newVapaa.toLowerCase();
      });
      if (hasDuplicateAddress) {
        console.log(`Skipping wallet with duplicate address and VAPAA: ${wallet.address}, VAPAA: ${wallet.vapaa || '0x0000...'}`);
        return false;
      }
      
      return true;
    });

    if (validNewWallets.length === 0) {
      console.log('[addVavityAggregator] All wallets are duplicates, but continuing to return existing data');
      // Return existing data instead of error - wallet might already exist
      return res.status(200).json({ 
        message: 'All wallets already exist', 
        data: existingData 
      });
    }

    const updatedWallets = [...existingWallets, ...validNewWallets];

    // Calculate new vavity combinations per VAPAA
    const newVavityCombinations = calculateVavityCombinations(updatedWallets);
    
    // Merge with existing vavityCombinations (preserve existing VAPAAs)
    const existingVavityCombinations = existingData.vavityCombinations || {};
    const updatedVavityCombinations = { ...existingVavityCombinations };
    
    // Update or add VAPAA combinations
    Object.keys(newVavityCombinations).forEach((vapaa) => {
      if (updatedVavityCombinations[vapaa]) {
        // Merge existing totals
        updatedVavityCombinations[vapaa] = {
          acVatoc: updatedVavityCombinations[vapaa].acVatoc + newVavityCombinations[vapaa].acVatoc,
          acVact: updatedVavityCombinations[vapaa].acVact + newVavityCombinations[vapaa].acVact,
          acdVatoc: updatedVavityCombinations[vapaa].acdVatoc + newVavityCombinations[vapaa].acdVatoc,
          acVactTaa: updatedVavityCombinations[vapaa].acVactTaa + newVavityCombinations[vapaa].acVactTaa,
        };
      } else {
        // Add new VAPAA
        updatedVavityCombinations[vapaa] = newVavityCombinations[vapaa];
      }
    });

    // VAPA is now stored in global /api/vapa endpoint, not in VavityAggregate.json
    const newData = {
      ...existingData,
      wallets: updatedWallets,
      vavityCombinations: updatedVavityCombinations,
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

