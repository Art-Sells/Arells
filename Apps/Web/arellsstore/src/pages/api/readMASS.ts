// pages/api/readMASS.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

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

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const { email } = req.query as { email?: string };
  if (!email) return res.status(400).json({ error: 'Email query parameter is required' });

  const keyArray = `${email}/MASSwallets.json`;
  const keyLegacy = `${email}/MASSwallet.json`;

  const readJson = async (Key: string) => {
    const obj = await s3.getObject({ Bucket: BUCKET_NAME, Key }).promise();
    if (!obj.Body) return null;
    return JSON.parse(obj.Body.toString());
  };

  const writeJson = async (Key: string, body: unknown) => {
    await s3.putObject({
      Bucket: BUCKET_NAME,
      Key,
      Body: JSON.stringify(body),
      ContentType: 'application/json',
    }).promise();
  };

  try {
    // Try the new array file first
    let file: WalletFile | null = null;
    try {
      const parsed = await readJson(keyArray);
      if (parsed && Array.isArray(parsed.wallets)) {
        file = {
          createdAt: parsed.createdAt ?? new Date().toISOString(),
          updatedAt: parsed.updatedAt ?? parsed.createdAt ?? new Date().toISOString(),
          wallets: parsed.wallets as WalletEntry[],
        };
      }
    } catch (e: any) {
      if (!(e?.code === 'NoSuchKey' || e?.code === 'NotFound')) {
        throw e;
      }
    }

    // If the array file doesn't exist, migrate from legacy single-object file
    if (!file) {
      try {
        const legacy = await readJson(keyLegacy);
        if (legacy && (legacy.MASSaddress || legacy.MASSkey)) {
          const now = new Date().toISOString();
          const entry: WalletEntry = {
            id: legacy.id || require('uuid').v4(),
            createdAt: legacy.createdAt || now,
            MASSaddress: legacy.MASSaddress,
            MASSkey: legacy.MASSkey,
          };
          file = { createdAt: now, updatedAt: now, wallets: [entry] };
          await writeJson(keyArray, file); // write migrated array file
        }
      } catch (e: any) {
        if (!(e?.code === 'NoSuchKey' || e?.code === 'NotFound')) {
          throw e;
        }
      }
    }

    if (!file || !file.wallets.length) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Latest = last element (append semantics)
    const latest = file.wallets[file.wallets.length - 1];

    // Back-compat top-level fields expected by your client:
    // MASSaddress, MASSkey, id — plus the full wallets array.
    return res.status(200).json({
      ...file,
      latest,
      MASSaddress: latest.MASSaddress,
      MASSkey: latest.MASSkey,
      id: latest.id,
    });
  } catch (error: any) {
    if (error?.code === 'NoSuchKey' || error?.code === 'NotFound') {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    console.error('Error fetching wallet data:', error?.message || error);
    return res.status(500).json({ error: 'Error fetching wallet data', details: error?.message ?? null });
  }
};