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
    combinationsByVapaa[vapaa].acVactTaa += wallet.cVactTaa ?? 0;
  });

  return combinationsByVapaa;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, vavityCombinations, wallets, balances, globalVapa } = req.body; // balances: array of { address, balance, vapaa }, globalVapa: optional global VAPA value

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

    // If balances are provided, update wallets with balance-based calculations
    // Otherwise, just recalculate cVact, cVatoc, cdVatoc from existing cVactTaa
    let validatedWallets: any[];
    
    // CRITICAL: Choose which wallets to use based on whether balances are provided
    // - When balances ARE provided (from fetchBalance): Use existingData.wallets (fresh from S3) to get latest cVactTaa
    // - When balances are NOT provided (from connectVavityAsset): Use wallets passed in (they have the new cVactTaa)
    const walletsToProcess = (balances && Array.isArray(balances) && balances.length > 0) 
      ? (existingData.wallets || wallets)  // fetchBalance: use S3 data
      : wallets;  // connectVavityAsset: use passed-in wallets with new cVactTaa
    
    if (balances && Array.isArray(balances) && balances.length > 0) {
      // Update wallets with balance-based calculations (from fetchBalance)
      // Use walletsToProcess (fresh from S3) to get latest cVactTaa values
      validatedWallets = walletsToProcess.map((wallet: any) => {
        // Only update wallets where depositPaid is true
        if (wallet.depositPaid !== true) {
          // Just recalculate cVact, cVatoc, cdVatoc from existing values
          const cVactTaa = wallet.cVactTaa;
          if (!cVactTaa) {
            throw new Error(`Wallet ${wallet.address} has missing cVactTaa. cVactTaa must be valid.`);
          }
          const cpVact = wallet.cpVact || 0;
          const cpVatoc = wallet.cpVatoc || cpVact;
          const recalculatedCVact = cVactTaa * cpVact;
          const recalculatedCVatoc = cVactTaa * cpVatoc;
          const recalculatedCdVatoc = recalculatedCVact - recalculatedCVatoc;
          
          return {
            ...wallet,
            cVact: parseFloat(recalculatedCVact.toFixed(2)),
            cVatoc: parseFloat(recalculatedCVatoc.toFixed(2)),
            cdVatoc: parseFloat(recalculatedCdVatoc.toFixed(2)),
          };
        }
        
        // Find balance for this wallet
        const balanceData = balances.find(
          (b: any) => b.address?.toLowerCase() === wallet.address?.toLowerCase() &&
                      (b.vapaa || '0x0000000000000000000000000000000000000000').toLowerCase() === 
                      (wallet.vapaa || '0x0000000000000000000000000000000000000000').toLowerCase()
        );
        
        if (balanceData) {
          if (balanceData.balance === null || balanceData.balance === undefined) {
            // No balance data, recalculate from existing values
            const cVactTaa = wallet.cVactTaa;
            if (!cVactTaa) {
              throw new Error(`Wallet ${wallet.address} has missing cVactTaa. cVactTaa must be valid.`);
            }
            const cpVact = wallet.cpVact || 0;
            const cpVatoc = wallet.cpVatoc || cpVact;
            const recalculatedCVact = cVactTaa * cpVact;
            const recalculatedCVatoc = cVactTaa * cpVatoc;
            const recalculatedCdVatoc = recalculatedCVact - recalculatedCVatoc;
            
            return {
              ...wallet,
              cVact: parseFloat(recalculatedCVact.toFixed(2)),
              cVatoc: parseFloat(recalculatedCVatoc.toFixed(2)),
              cdVatoc: parseFloat(recalculatedCdVatoc.toFixed(2)),
            };
          }
          const currentBalance = parseFloat(balanceData.balance);
          if (isNaN(currentBalance)) {
            // Invalid balance, recalculate from existing values
            const cVactTaa = wallet.cVactTaa;
            if (!cVactTaa) {
              throw new Error(`Wallet ${wallet.address} has missing cVactTaa. cVactTaa must be valid.`);
            }
            const cpVact = wallet.cpVact || 0;
            const cpVatoc = wallet.cpVatoc || cpVact;
            const recalculatedCVact = cVactTaa * cpVact;
            const recalculatedCVatoc = cVactTaa * cpVatoc;
            const recalculatedCdVatoc = recalculatedCVact - recalculatedCVatoc;
            
            return {
              ...wallet,
              cVact: parseFloat(recalculatedCVact.toFixed(2)),
              cVatoc: parseFloat(recalculatedCVatoc.toFixed(2)),
              cdVatoc: parseFloat(recalculatedCdVatoc.toFixed(2)),
            };
          }
          const currentCVactTaa = wallet.cVactTaa;
          if (!currentCVactTaa) {
            throw new Error(`Wallet ${wallet.address} has missing cVactTaa. cVactTaa must be valid.`);
          }
          
          // Update cVactTaa: only allow decrease, never increase
          let newCVactTaa: number;
          if (currentBalance < currentCVactTaa) {
            // Balance decreased - update cVactTaa to reflect the lower balance
            newCVactTaa = currentBalance;
            console.log(`[saveVavityAggregator] 📝 cVactTaa UPDATE: ${wallet.address} | ${currentCVactTaa} -> ${newCVactTaa} | Reason: balance decreased`);
          } else {
            // Balance is same or higher - preserve original cVactTaa (connection-time snapshot)
            newCVactTaa = currentCVactTaa;
          }
          
          // cpVact should always be >= global VAPA (if provided)
          const newCpVact = globalVapa ? Math.max(wallet.cpVact || 0, globalVapa) : (wallet.cpVact || 0);
          const newCpVatoc = wallet.cpVatoc && wallet.cpVatoc > 0 ? wallet.cpVatoc : newCpVact;
          
          // Calculate cVact, cVatoc, cdVatoc using formulas
          const newCVact = newCVactTaa * newCpVact;
          const newCVatoc = newCVactTaa * newCpVatoc;
          const newCdVatoc = newCVact - newCVatoc;
          
          console.log(`[saveVavityAggregator] Updating wallet ${wallet.address}: balance=${currentBalance}, cVactTaa=${currentCVactTaa} -> ${newCVactTaa}`);
          
          return {
            ...wallet,
            vapaa: wallet.vapaa || '0x0000000000000000000000000000000000000000',
            depositPaid: wallet.depositPaid !== undefined ? wallet.depositPaid : true,
            cVactTaa: newCVactTaa,
            cpVact: newCpVact,
            cpVatoc: newCpVatoc,
            cVact: parseFloat(newCVact.toFixed(2)),
            cVatoc: parseFloat(newCVatoc.toFixed(2)),
            cdVatoc: parseFloat(newCdVatoc.toFixed(2)),
          };
        }
        
        // No balance data found, just recalculate from existing values
        const cVactTaa = wallet.cVactTaa;
        if (!cVactTaa) {
          throw new Error(`Wallet ${wallet.address} has missing cVactTaa. cVactTaa must be valid.`);
        }
        const cpVact = wallet.cpVact || 0;
        const cpVatoc = wallet.cpVatoc || cpVact;
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
    } else {
      // No balances provided, just recalculate cVact, cVatoc, cdVatoc from existing cVactTaa
      // Use walletsToProcess (fresh from S3) to get latest cVactTaa values
      validatedWallets = walletsToProcess.map((wallet: any) => {
        const cVactTaa = wallet.cVactTaa;
        
        // cVactTaa must be valid - throw error if missing
        if (!cVactTaa) {
          throw new Error(`Wallet ${wallet.address} has missing cVactTaa. cVactTaa must be valid.`);
        }
        
        const cpVact = wallet.cpVact || 0;
        const cpVatoc = wallet.cpVatoc || cpVact;
        
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
    }
    
    // ✅ MERGE wallets: Update existing wallets or add new ones
    // This prevents overwriting wallets that aren't in the validatedWallets array
    const existingWallets = existingData.wallets || [];
    const mergedWallets: any[] = [];
    
    // Create a map of existing wallets by address+vapaa for quick lookup
    const existingWalletsMap = new Map<string, any>();
    existingWallets.forEach((wallet: any) => {
      const key = `${wallet.address?.toLowerCase() || ''}_${(wallet.vapaa || '0x0000000000000000000000000000000000000000').toLowerCase()}`;
      existingWalletsMap.set(key, wallet);
    });
    
    // Process validated wallets (from fetchBalance or other sources)
    const processedKeys = new Set<string>();
    validatedWallets.forEach((validatedWallet: any) => {
      const key = `${validatedWallet.address?.toLowerCase() || ''}_${(validatedWallet.vapaa || '0x0000000000000000000000000000000000000000').toLowerCase()}`;
      processedKeys.add(key);
      mergedWallets.push(validatedWallet);
    });
    
    // Add existing wallets that weren't in validatedWallets (preserve wallets not being updated)
    existingWallets.forEach((existingWallet: any) => {
      const key = `${existingWallet.address?.toLowerCase() || ''}_${(existingWallet.vapaa || '0x0000000000000000000000000000000000000000').toLowerCase()}`;
      if (!processedKeys.has(key)) {
        // Recalculate this wallet's values too (for consistency)
        const cVactTaa = existingWallet.cVactTaa;
        
        // Skip this wallet if cVactTaa is missing
        if (!cVactTaa) {
          console.error(`[saveVavityAggregator] Skipping wallet ${existingWallet.address} with missing cVactTaa. cVactTaa must be valid.`);
          return; // Skip this wallet - don't include it in mergedWallets
        }
        
        const cpVact = existingWallet.cpVact || 0;
        const cpVatoc = existingWallet.cpVatoc || cpVact;
        const recalculatedCVact = cVactTaa * cpVact;
        const recalculatedCVatoc = cVactTaa * cpVatoc;
        const recalculatedCdVatoc = recalculatedCVact - recalculatedCVatoc;
        
        mergedWallets.push({
          ...existingWallet,
          cVact: parseFloat(recalculatedCVact.toFixed(2)),
          cVatoc: parseFloat(recalculatedCVatoc.toFixed(2)),
          cdVatoc: parseFloat(recalculatedCdVatoc.toFixed(2)),
        });
      }
    });
    
    // Always recalculate vavityCombinations from merged wallets to ensure accuracy
    // This ensures acdVatoc and other totals are always correct based on current wallet data
    const calculatedVavityCombinations = calculateVavityCombinations(mergedWallets);

    const newData = {
      wallets: mergedWallets, // ← merged wallets (updated + preserved)
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

    // Update assetConnected in VavityConnection based on balance > cVactTaa
    // Only if balances were provided (from fetchBalance)
    if (balances && Array.isArray(balances) && balances.length > 0) {
      try {
        const connectionKey = `${email}/VavityConnection.json`;
        
        // Fetch current connections
        let vavityConnections: any[] = [];
        try {
          const connectionResponse = await s3.getObject({ Bucket: BUCKET_NAME, Key: connectionKey }).promise();
          if (connectionResponse.Body) {
            vavityConnections = JSON.parse(connectionResponse.Body.toString());
          }
        } catch (err: any) {
          if (err.code !== 'NoSuchKey') {
            console.warn('[saveVavityAggregator] Could not fetch VavityConnection:', err.message);
          }
        }

        // For each wallet with depositPaid=true, update matching connections
        const walletsWithDepositPaid = mergedWallets.filter((w: any) => w.depositPaid === true);
        let hasConnectionChanges = false;

        for (const wallet of walletsWithDepositPaid) {
          // Find balance for this wallet
          const balanceData = balances.find(
            (b: any) => b.address?.toLowerCase() === wallet.address?.toLowerCase() &&
                        (b.vapaa || '0x0000000000000000000000000000000000000000').toLowerCase() === 
                        (wallet.vapaa || '0x0000000000000000000000000000000000000000').toLowerCase()
          );

          if (!balanceData) continue;

          if (balanceData.balance === null || balanceData.balance === undefined) {
            continue;
          }
          const currentBalance = parseFloat(balanceData.balance);
          if (isNaN(currentBalance)) {
            continue;
          }
          const cVactTaa = wallet.cVactTaa;
          if (!cVactTaa) {
            console.error(`[saveVavityAggregator] Skipping assetConnected update for wallet ${wallet.address} with missing cVactTaa`);
            continue; // Skip this wallet
          }
          const shouldBeConnected = currentBalance <= cVactTaa;

          // Find all matching connections (could be multiple if same address has both metamask/base)
          const matchingConnections = vavityConnections.filter(
            (conn: any) => conn.address?.toLowerCase() === wallet.address?.toLowerCase()
          );

          // Update each matching connection
          for (const conn of matchingConnections) {
            if (conn.assetConnected !== shouldBeConnected) {
              conn.assetConnected = shouldBeConnected;
              hasConnectionChanges = true;
              console.log(`[saveVavityAggregator] Updated assetConnected for ${conn.address} (${conn.walletType}): ${!shouldBeConnected} -> ${shouldBeConnected} (balance: ${currentBalance}, cVactTaa: ${cVactTaa})`);
            }
          }
        }

        // Save updated connections if any were changed
        if (hasConnectionChanges) {
          await s3.putObject({
            Bucket: BUCKET_NAME,
            Key: connectionKey,
            Body: JSON.stringify(vavityConnections),
            ContentType: 'application/json',
          }).promise();
          console.log('[saveVavityAggregator] Successfully updated assetConnected values in VavityConnection');
        }
      } catch (connectionError) {
        // Non-critical error - log but don't throw (wallet updates already succeeded)
        console.warn('[saveVavityAggregator] Error updating assetConnected (non-critical, wallet updates succeeded):', connectionError);
      }
    }

    return res.status(200).json({ message: 'Data saved successfully', data: newData });
  } catch (error) {
    console.error('❌ Error during processing:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
