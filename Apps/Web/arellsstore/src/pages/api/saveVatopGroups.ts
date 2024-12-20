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

        try {
            const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
            existingData = JSON.parse(data.Body!.toString());
        } catch (err: any) {
            if (err.code !== 'NoSuchKey') {
                console.error('Error fetching existing data:', err);
                return res.status(500).json({ error: 'Failed to fetch existing data' });
            }
            existingData = {}; // If no existing data, start fresh
        }

        console.log('Existing data:', JSON.stringify(existingData));

        const updatedVatopGroups = (vatopGroups || existingData.vatopGroups || []).map((group: { id: any; hasOwnProperty: (arg0: string) => any; supplicateWBTCtoUSD: any; }) => {
          const existingGroup = existingData.vatopGroups?.find((g: { id: any; }) => g.id === group.id) || {};
          return {
              ...group, // First apply new group properties
              ...existingGroup, // Override with existing group properties if available
              supplicateWBTCtoUSD: group.hasOwnProperty('supplicateWBTCtoUSD') 
                  ? group.supplicateWBTCtoUSD 
                  : existingGroup.supplicateWBTCtoUSD, // Explicitly handle supplicateWBTCtoUSD
          };
        });

        console.log('Updated vatopGroups:', JSON.stringify(updatedVatopGroups));

        const newData = {
            vatopGroups: updatedVatopGroups,
            vatopCombinations: vatopCombinations || existingData.vatopCombinations || {},
            soldAmounts: soldAmounts !== undefined ? soldAmounts : existingData.soldAmounts || 0,
            transactions: transactions || existingData.transactions || [],
        };

        await s3.putObject({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: JSON.stringify(newData),
            ContentType: 'application/json',
            ACL: 'private',
        }).promise();

        return res.status(200).json({ message: 'Data saved successfully', data: newData });
    } catch (error) {
        console.error('Error during processing:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export default handler;