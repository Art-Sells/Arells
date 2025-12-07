import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

const calculateVatopCombinations = (groups: any[]) => {
  return groups.reduce(
    (acc, group) => {
      acc.acVatops += group.cVatop || 0;
      acc.acVacts += group.cVact || 0;
      acc.acVactDat += group.cVactDat || 0;
      acc.acVactDas += group.cVactDa || 0;
      acc.acdVatops += group.cVact - group.cVatop > 0 ? group.cVact - group.cVatop : 0;
      acc.acVactTaa += group.cVactTaa || 0;
      return acc;
    },
    {
      acVatops: 0,
      acVacts: 0,
      acVactDat: 0,
      acVactDas: 0,
      acdVatops: 0,
      acVactTaa: 0,
    }
  );
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, newVatopGroups } = req.body;

  if (!email || !Array.isArray(newVatopGroups) || newVatopGroups.length === 0) {
    console.error("Invalid request data:", { email, newVatopGroups });
    return res.status(400).json({ error: 'Invalid request: Missing email or newVatopGroups' });
  }

  try {
    const key = `${email}/vatop-data.json`;

    // Fetch existing data from S3
    let existingData: any = {};
    try {
      const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
      existingData = JSON.parse(data.Body!.toString());
    } catch (err: any) {
      if (err.code === 'NoSuchKey') {
        console.warn("No existing data found for user:", email);
      } else {
        throw err;
      }
    }

    const existingGroups = Array.isArray(existingData.vatopGroups) ? existingData.vatopGroups : [];

    // Filter out groups with duplicate IDs
    const validNewGroups = newVatopGroups.filter(
      (group: any) => group.id && !existingGroups.some((existingGroup: any) => existingGroup.id === group.id)
    );

    if (validNewGroups.length === 0) {
      return res.status(400).json({ error: 'No valid groups to add' });
    }

    const updatedVatopGroups = [...existingGroups, ...validNewGroups];

    // Calculate new vatop combinations
    const updatedVatopCombinations = calculateVatopCombinations(updatedVatopGroups);

    const newData = {
      ...existingData,
      vatopGroups: updatedVatopGroups,
      vatopCombinations: updatedVatopCombinations,
    };

    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(newData),
        ContentType: 'application/json',
        ACL: 'private',
      })
      .promise();

    return res.status(200).json({ 
      message: 'New groups added successfully', 
      data: newData 
    });
  } catch (error) {
    console.error('Error during processing:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;

