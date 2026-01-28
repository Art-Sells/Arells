import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

// Calculate totals for investments
const calculateTotals = (investments: any[]) => {
  return investments.reduce(
    (acc, inv) => {
      const cVatop = inv.cVatop || 0;
      const cVact = inv.cVact || 0;
      const cdVatop = inv.cdVatop || 0;
      const cVactTaa = inv.cVactTaa ?? 0;
      return {
        acVatop: acc.acVatop + cVatop,
        acVact: acc.acVact + cVact,
        acdVatop: acc.acdVatop + cdVatop,
        acVactTaa: acc.acVactTaa + cVactTaa,
      };
    },
    { acVatop: 0, acVact: 0, acdVatop: 0, acVactTaa: 0 }
  );
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, investments } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  try {
    const key = `${email}/VavityAggregate.json`;

    // Fetch existing data from S3
    let existingData: any = {};
    try {
      const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
      existingData = JSON.parse(data.Body!.toString());
    } catch (err: any) {
      if (err.code === 'NoSuchKey') {
        console.warn("⚠️ No existing data found for user:", email);
        existingData = { investments: [] };
      } else {
        throw err;
      }
    }

    const existingInvestments = Array.isArray(existingData.investments) ? existingData.investments : [];
    const incomingInvestments = Array.isArray(investments) ? investments : existingInvestments;

    const normalizedInvestments = incomingInvestments.map((inv: any) => {
      const cVatop = inv.cVatop ?? 0;
      const cpVatop = inv.cpVatop ?? 0;
      const cVactTaa = inv.cVactTaa ?? 0;
      const cpVact = inv.cpVact ?? cpVatop;
      const cVact = inv.cVact ?? cVactTaa * cpVact;
      const cdVatop = inv.cdVatop ?? (cVact - cVatop);
      return {
        ...inv,
        cVatop: parseFloat(cVatop.toFixed(2)),
        cpVatop,
        cVactTaa: parseFloat(cVactTaa.toFixed(8)),
        cpVact,
        cVact: parseFloat(cVact.toFixed(2)),
        cdVatop: parseFloat(cdVatop.toFixed(2)),
      };
    });

    const totals = calculateTotals(normalizedInvestments);

    const newData = {
      investments: normalizedInvestments,
      totals,
    };

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
