import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, vatopGroups, vatopCombinations, soldAmounts, transactions } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  try {
    const key = `${email}/vatop-data.json`;
    let existingData: any = {};

    // Fetch existing data from S3
    try {
      const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
      existingData = JSON.parse(data.Body!.toString());
    } catch (err: any) {
      if (err.code !== 'NoSuchKey') {
        throw err;
      }
    }

    // Merge or replace existing vatopGroups with the new ones
    const mergedVatopGroups = vatopGroups.map((group: any) => {
      const existingGroup = existingData.vatopGroups?.find((g: any) => g.cpVatop === group.cpVatop) || {};
      return {
        ...existingGroup,
        ...group,
        supplicateWBTCtoUSD: group.supplicateWBTCtoUSD ?? existingGroup.supplicateWBTCtoUSD ?? false,
      };
    });

    // Prepare the new data
    const newData = {
      vatopGroups: mergedVatopGroups,
      vatopCombinations: vatopCombinations || existingData.vatopCombinations || {},
      soldAmounts: soldAmounts !== undefined ? soldAmounts : existingData.soldAmounts || 0,
      transactions: transactions || existingData.transactions || [],
    };

    // Save the updated data to S3
    await s3.putObject({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(newData),
      ContentType: 'application/json',
      ACL: 'private',
    }).promise();

    return res.status(200).json({ message: 'Data saved successfully', data: newData });
  } catch (error) {
    console.error('Error saving data:', error);
    return res.status(500).json({ error: 'Failed to save data' });
  }
};

export default handler;