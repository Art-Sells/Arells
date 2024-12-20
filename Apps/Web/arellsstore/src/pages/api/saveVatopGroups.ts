import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, vatopGroups, vatopCombinations, soldAmounts, transactions } = req.body;
  console.log('Incoming payload:', JSON.stringify(req.body, null, 2));

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  try {
    const key = `${email}/vatop-data.json`;
    let existingData: any = {};

    // Fetch existing data
    try {
      const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
      existingData = JSON.parse(data.Body!.toString());
    } catch (err: any) {
      if (err.code !== 'NoSuchKey') {
        throw err;
      }
    }

    const existingGroups = Array.isArray(existingData.vatopGroups) ? existingData.vatopGroups : [];
    const updatedVatopGroups = vatopGroups.map((group: any) => {
      const existingGroup = existingGroups.find((g: any) => g.id === group.id) || {};

      // Calculate `cpVact` safely
      const cpVact = Math.max(
        group.HAP ?? existingGroup.HAP ?? group.cpVatop, 
        existingGroup.cpVact ?? group.cpVatop
      );

      // Calculate `cVact` based on `cVactTa` and `cpVact`
      const cVact = (group.cVactTa ?? 0) * cpVact;

      return {
        ...existingGroup,
        ...group,
        cpVact,
        cVact,
        cVactTaa: cpVact >= group.cpVatop ? group.cVactTa : 0,
        cVactDa: cpVact < group.cpVatop ? cVact : 0,
        supplicateWBTCtoUSD: group.supplicateWBTCtoUSD ?? existingGroup.supplicateWBTCtoUSD ?? false,
      };
    });

    const newData = {
      vatopGroups: updatedVatopGroups,
      vatopCombinations: vatopCombinations ?? existingData.vatopCombinations ?? {},
      soldAmounts: soldAmounts ?? existingData.soldAmounts ?? 0,
      transactions: transactions ?? existingData.transactions ?? [],
    };
    
    console.log('Validated payload to save:', JSON.stringify(newData, null, 2));

    console.log('Final payload to save:', JSON.stringify(newData, null, 2));

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