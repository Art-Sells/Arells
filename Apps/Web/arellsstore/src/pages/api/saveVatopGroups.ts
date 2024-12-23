import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, vatopGroups = [], vatopCombinations, soldAmounts, transactions } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  try {
    const key = `${email}/vatop-data.json`;

    // Fetch existing data from S3
    let existingData: any = {};
    try {
      const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
      existingData = JSON.parse(data.Body!.toString());
      console.log("Existing data loaded:", existingData);
    } catch (err: any) {
      if (err.code === 'NoSuchKey') {
        console.warn("No existing data found for user:", email);
        return res.status(400).json({ error: 'No existing data found for this user.' });
      } else {
        throw err;
      }
    }

    const existingGroups = Array.isArray(existingData.vatopGroups) ? existingData.vatopGroups : [];
    console.log("Existing Groups from Backend:", JSON.stringify(existingGroups, null, 2));
    console.log("Incoming Groups from Frontend:", JSON.stringify(vatopGroups, null, 2));

    // Validate incoming groups against existingGroups
    const updatedVatopGroups = existingGroups.map((existingGroup: any) => {
      const incomingGroup = vatopGroups.find((group: any) => group.id === existingGroup.id);

      // Only update if incoming group matches the existing group's ID
      if (incomingGroup) {
        return {
          ...existingGroup,
          HAP: incomingGroup.HAP ?? existingGroup.HAP,
          cpVatop: incomingGroup.cpVatop ?? existingGroup.cpVatop,
          cVactDat: incomingGroup.cVactDat ?? existingGroup.cVactDat,
          supplicateWBTCtoUSD: incomingGroup.supplicateWBTCtoUSD ?? existingGroup.supplicateWBTCtoUSD ?? false,
          supplicateUSDtoWBTC: incomingGroup.supplicateUSDtoWBTC ?? existingGroup.supplicateUSDtoWBTC ?? false,
        };
      }

      // If no matching incoming group, retain existing group as-is
      return existingGroup;
    });

    // Build the new data object
    const newData = {
      vatopGroups: updatedVatopGroups,
      vatopCombinations: vatopCombinations ?? existingData.vatopCombinations ?? {},
      soldAmounts: soldAmounts ?? existingData.soldAmounts ?? 0,
      transactions: transactions ?? existingData.transactions ?? [],
    };

    console.log("Final Data Object to Save:", JSON.stringify(newData, null, 2));

    // Save the updated data to S3
    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(newData),
        ContentType: 'application/json',
        ACL: 'private',
      })
      .promise();

    return res.status(200).json({ message: 'Data saved successfully', data: newData });
  } catch (error) {
    console.error('Error during processing:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;