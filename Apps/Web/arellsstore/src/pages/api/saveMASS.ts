// pages/api/saveMASS.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

export default async function saveMASS(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { MASSaddress, MASSkey, email } = req.body as {
    MASSaddress: string;
    MASSkey: string;
    email: string;
  };

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  if (!MASSaddress || !MASSkey) {
    return res.status(400).json({ error: 'MASSaddress and MASSkey are required' });
  }

  const key = `${email}/MASSwallet.json`;

  try {
    // Does the file already exist?
    await s3.headObject({ Bucket: BUCKET_NAME, Key: key }).promise();

    // Fetch existing object to surface its ID (if any)
    const existing = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
    let existingId: string | null = null;
    if (existing.Body) {
      try {
        const parsed = JSON.parse(existing.Body.toString());
        if (parsed?.id) existingId = parsed.id as string;
      } catch {
        // ignore parse errors; nothing to return
      }
    }
    return res.status(200).json({
      message: 'File already exists, skipping creation',
      id: existingId,
    });
  } catch (error: any) {
    if (error.code === 'NotFound' || error.code === 'NoSuchKey') {
      // Create new wallet object with UUID and timestamp
      const id = uuidv4();
      const createdAt = new Date().toISOString();

      const body = JSON.stringify({
        id,
        createdAt,
        MASSaddress,
        MASSkey, // (still encrypted)
      });

      await s3.putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: 'application/json',
      }).promise();

      return res.status(201).json({ message: 'Wallet saved successfully', id });
    }

    console.error('Error accessing S3:', error);
    return res.status(500).json({ error: 'Failed to access S3', details: error.message });
  }
}