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
            console.log('Fetched existing data from S3:', JSON.stringify(existingData, null, 2));
        } catch (err: any) {
            if (err.code !== 'NoSuchKey') {
                console.error('Error fetching existing data:', err);
                return res.status(500).json({ error: 'Failed to fetch existing data' });
            }
            existingData = {}; // If no existing data, start fresh
            console.log('No existing data found; initializing empty data.');
        }

        console.log('Incoming vatopGroups:', JSON.stringify(vatopGroups, null, 2));
        
        const updatedVatopGroups = (vatopGroups || existingData.vatopGroups || []).map((group: { id: any; hasOwnProperty: (arg0: string) => any; supplicateWBTCtoUSD: any; }) => {
          const existingGroup = existingData.vatopGroups?.find((g: { id: any; }) => g.id === group.id) || {};
          console.log('Processing group:', JSON.stringify(group, null, 2));
          console.log('Matching existing group:', JSON.stringify(existingGroup, null, 2));
      
          const mergedGroup = {
              ...existingGroup, // Start with existing properties
              ...group,
              supplicateWBTCtoUSD:
                  existingGroup.supplicateWBTCtoUSD === true // Retain `true` if it exists in existing data
                      ? true
                      : group.supplicateWBTCtoUSD !== undefined
                      ? group.supplicateWBTCtoUSD // Use explicitly provided value if it exists
                      : false, // Default to false if neither exists
          };
      
          console.log('Merged group:', JSON.stringify(mergedGroup, null, 2));
          return mergedGroup;
      });

        console.log('Updated vatopGroups after processing:', JSON.stringify(updatedVatopGroups, null, 2));

        const newData = {
            vatopGroups: updatedVatopGroups,
            vatopCombinations: vatopCombinations || existingData.vatopCombinations || {},
            soldAmounts: soldAmounts !== undefined ? soldAmounts : existingData.soldAmounts || 0,
            transactions: transactions || existingData.transactions || [],
        };

        console.log('Final data to save:', JSON.stringify(newData, null, 2));

        await s3.putObject({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: JSON.stringify(newData),
            ContentType: 'application/json',
            ACL: 'private',
        }).promise();

        console.log('Data successfully saved to S3.');

        return res.status(200).json({ message: 'Data saved successfully', data: newData });
    } catch (error) {
        console.error('Error during processing:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export default handler;