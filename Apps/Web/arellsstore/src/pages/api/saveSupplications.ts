import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, supplicationUpdates } = req.body;

  if (!email || !supplicationUpdates || !Array.isArray(supplicationUpdates)) {
    return res.status(400).json({ error: 'Invalid request payload' });
  }

  const key = `${email}/vatop-data.json`;

  try {
    let existingData: any = {};
    try {
      const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
      existingData = JSON.parse(data.Body!.toString());
    } catch (err: any) {
      if (err.code === 'NoSuchKey') {
        return res.status(404).json({ error: 'User data not found' });
      }
      throw err;
    }

    const updatedGroups = (existingData.vatopGroups || []).map((group: any) => {
      const update = supplicationUpdates.find((update: any) => update.id === group.id);
      if (update) {
        return {
          ...group,
          supplicateCBBTCtoUSD: update.supplicateCBBTCtoUSD ?? group.supplicateCBBTCtoUSD,
          supplicateUSDtoCBBTC: update.supplicateUSDtoCBBTC ?? group.supplicateUSDtoCBBTC,
          holdMASS: update.holdMASS ?? group.holdMASS,
        };
      }
      return group;
    });

    const updatedData = { ...existingData, vatopGroups: updatedGroups };

    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(updatedData),
        ContentType: 'application/json',
        ACL: 'private',
      })
      .promise();

    return res.status(200).json({ message: 'Supplications updated successfully' });
  } catch (error) {
    console.error('Error updating supplications:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;