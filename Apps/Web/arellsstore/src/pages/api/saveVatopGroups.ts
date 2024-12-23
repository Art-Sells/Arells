import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, vatopCombinations, vatopGroups } = req.body;

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
      console.log("📥 Existing data loaded from S3:", existingData);
    } catch (err: any) {
      if (err.code === 'NoSuchKey') {
        console.warn("⚠️ No existing data found for user:", email);
        existingData = { vatopGroups: [], vatopCombinations: {}, soldAmounts: 0, transactions: [] };
      } else {
        throw err;
      }
    }

    // Merge or update vatopGroups
    const existingGroups = Array.isArray(existingData.vatopGroups) ? existingData.vatopGroups : [];
    const updatedVatopGroups = vatopGroups.map((incomingGroup: any) => {
      const existingGroup = existingGroups.find((group: any) => group.id === incomingGroup.id);
      if (existingGroup) {
        console.log(`🔄 Updating existing group: ${incomingGroup.id}`);
        return { ...existingGroup, ...incomingGroup }; // Merge updates
      } else {
        console.log(`➕ Adding new group: ${incomingGroup.id}`);
        return incomingGroup; // Add new group
      }
    });

    // Merge vatopCombinations
    const updatedVatopCombinations = {
      ...existingData.vatopCombinations,
      ...vatopCombinations,
    };

    console.log("🔄 Merged vatopCombinations:", JSON.stringify(updatedVatopCombinations, null, 2));

    // Build the new data object
    const newData = {
      vatopGroups: updatedVatopGroups,
      vatopCombinations: updatedVatopCombinations,
      soldAmounts: existingData.soldAmounts ?? 0,
      transactions: existingData.transactions ?? [],
    };

    console.log("📝 Final Data Object to Save:", JSON.stringify(newData, null, 2));

    // Save the updated data back to S3
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
    console.error('❌ Error during processing:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;