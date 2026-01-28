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

  const { email, newInvestments } = req.body;

  if (!email || !Array.isArray(newInvestments) || newInvestments.length === 0) {
    console.error("Invalid request data:", { email, newInvestments });
    return res.status(400).json({ error: 'Invalid request: Missing email or newInvestments' });
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
        console.warn("No existing data found for user:", email);
      } else {
        throw err;
      }
    }

    const existingInvestments = Array.isArray(existingData.investments) ? existingData.investments : [];

    const normalizedNewInvestments = newInvestments.map((inv: any) => {
      const cVatop = inv.cVatop ?? 0;
      const cpVatop = inv.cpVatop ?? 0;
      const cVactTaa = inv.cVactTaa ?? 0;
      const cpVact = inv.cpVact ?? cpVatop;
      const cVact = inv.cVact ?? cVactTaa * cpVact;
      const cdVatop = inv.cdVatop ?? (cVact - cVatop);
      return {
        ...inv,
        cVatop: parseFloat(cVatop.toFixed(2)),
        cpVatop: cpVatop,
        cVactTaa: parseFloat(cVactTaa.toFixed(8)),
        cpVact: cpVact,
        cVact: parseFloat(cVact.toFixed(2)),
        cdVatop: parseFloat(cdVatop.toFixed(2)),
      };
    });

    const updatedInvestments = [...existingInvestments, ...normalizedNewInvestments];
    const totals = calculateTotals(updatedInvestments);

    const newData = {
      investments: updatedInvestments,
      totals,
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

