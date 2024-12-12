// pages/api/saveMASS.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

// Initialize AWS S3 with your configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

// Ensure the bucket name is treated as a string and provide a fallback if undefined
const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'default-bucket-name';

export default async function saveMASS(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { MASSaddress, MASSkey } = req.body as { MASSaddress: string; MASSkey: string };
    const key = `wallets/${MASSaddress}.json`;

    try {
        // Attempt to check if the file exists
        await s3.headObject({
            Bucket: BUCKET_NAME,
            Key: key
        }).promise();

        // If no error is thrown, the file exists
        return res.status(200).json({ message: 'File already exists, skipping creation' });
    } catch (error: any) {
        // AWS SDK throws an error if the key does not exist
        if (error.code === 'NotFound') {
            // File does not exist, create it
            await s3.putObject({
                Bucket: BUCKET_NAME,
                Key: key,
                Body: JSON.stringify({ MASSaddress, MASSkey }),
                ContentType: 'application/json'
            }).promise();

            return res.status(201).json({ message: 'Wallet saved successfully' });
        } else {
            console.error('Error accessing S3:', error);
            return res.status(500).json({ error: 'Failed to access S3', details: error.message });
        }
    }
}