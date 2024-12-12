// pages/api/readMASS.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import CryptoJS from 'crypto-js';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.query as { email: string };

  if (!email) {
    return res.status(400).json({ error: 'Email query parameter is required' });
  }

  const key = `${email}/MASSwallet.json`;

  try {
    const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
    
    // Check if the response body is not undefined
    if (response.Body) {
      const walletData = JSON.parse(response.Body.toString());

      // Optionally decrypt data if encrypted, such as the private key
      if (walletData.encryptedPrivateKey) {
        const decryptedPrivateKey = CryptoJS.AES.decrypt(walletData.encryptedPrivateKey, 'your-secret-key').toString(CryptoJS.enc.Utf8);
        walletData.privateKey = decryptedPrivateKey;  // Or handle decryption client-side as needed
      }

      return res.status(200).json(walletData);
    } else {
      // Handle the case where the body is undefined
      console.warn('No data found for the specified key:', key);
      return res.status(404).json({ error: 'Wallet not found' });
    }
  } catch (error: any) {
    if (error.code === 'NoSuchKey') {
      console.warn(`${key} not found. Returning default data.`);
      return res.status(404).json({ error: 'Wallet not found' });
    }

    console.error('Error fetching wallet data:', error.message || error);
    return res.status(500).json({ error: 'Error fetching wallet data', details: error.message || error });
  }
};