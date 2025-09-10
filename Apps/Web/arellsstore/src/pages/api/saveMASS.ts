// pages/api/saveMASS.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

type WalletEntry = {
  id: string;
  createdAt: string;
  MASSaddress: string;
  MASSkey: string; // encrypted
};

type WalletFile = {
  createdAt: string;
  updatedAt: string;
  wallets: WalletEntry[];
};

export default async function saveMASS(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { MASSaddress, MASSkey, email } = req.body as {
    MASSaddress?: string;
    MASSkey?: string;
    email?: string;
  };

  if (!email) return res.status(400).json({ error: 'Email is required' });
  if (!MASSaddress || !MASSkey) {
    return res.status(400).json({ error: 'MASSaddress and MASSkey are required' });
  }

  const key = `${email}/MASSwallets.json`;
  const now = new Date().toISOString();

  // New entry we want to add
  const newEntry: WalletEntry = {
    id: uuidv4(),
    createdAt: now,
    MASSaddress,
    MASSkey, // keep encrypted
  };

  try {
    // Try to read existing file
    const existing = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();

    let file: WalletFile;

    if (existing.Body) {
      // Parse and normalize legacy shapes if needed
      const parsed = JSON.parse(existing.Body.toString());

      // Legacy: single object { id?, createdAt?, MASSaddress, MASSkey }
      if (!Array.isArray(parsed?.wallets) && (parsed?.MASSaddress || parsed?.MASSkey)) {
        const legacyEntry: WalletEntry = {
          id: parsed.id || uuidv4(),
          createdAt: parsed.createdAt || now,
          MASSaddress: parsed.MASSaddress,
          MASSkey: parsed.MASSkey,
        };
        file = { createdAt: now, updatedAt: now, wallets: [legacyEntry] };
      } else {
        // Normal modern shape
        file = {
          createdAt: parsed.createdAt || now,
          updatedAt: parsed.updatedAt || now,
          wallets: Array.isArray(parsed.wallets) ? parsed.wallets : [],
        };
      }
    } else {
      // No body? start fresh
      file = { createdAt: now, updatedAt: now, wallets: [] };
    }

    // Dedupe by address (case-insensitive)
    const already = file.wallets.find(
      w => w.MASSaddress.toLowerCase() === MASSaddress.toLowerCase()
    );
    if (already) {
      return res.status(200).json({
        message: 'Wallet already exists',
        id: already.id,
        total: file.wallets.length,
      });
    }

    // Append and save
    file.wallets.push(newEntry);
    file.updatedAt = now;

    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(file),
        ContentType: 'application/json',
      })
      .promise();

    return res.status(201).json({
      message: 'Wallet appended',
      id: newEntry.id,
      total: file.wallets.length,
    });
  } catch (err: any) {
    // If file doesn’t exist yet, create it with the first entry
    if (err?.code === 'NoSuchKey' || err?.code === 'NotFound') {
      const file: WalletFile = { createdAt: now, updatedAt: now, wallets: [newEntry] };

      await s3
        .putObject({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: JSON.stringify(file),
          ContentType: 'application/json',
        })
        .promise();

      return res.status(201).json({ message: 'File created with first wallet', id: newEntry.id, total: 1 });
    }

    console.error('Error accessing S3:', err);
    return res.status(500).json({ error: 'Failed to access S3', details: err?.message ?? null });
  }
}