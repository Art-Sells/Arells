import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rawSessionId = req.query.sessionId;
  const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;
  const rawAsset = req.query.asset;
  const asset = Array.isArray(rawAsset) ? rawAsset[0] : rawAsset;
  const normalizedAsset = typeof asset === 'string' && asset.length ? asset.toLowerCase() : undefined;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId query parameter is required' });
  }

  const key = `sessions/${sessionId}/VavityAggregate.json`;

  try {
    const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
    const userData = JSON.parse(data.Body!.toString());
    if (normalizedAsset) {
      const filteredInvestments = Array.isArray(userData.investments)
        ? userData.investments.filter((entry: any) => (entry?.asset || 'bitcoin') === normalizedAsset)
        : [];
      const totals = filteredInvestments.reduce(
        (acc: any, inv: any) => {
          const cVatop = Number(inv.cVatop) || 0;
          const cVact = Number(inv.cVact) || 0;
          const cdVatop = Number(inv.cdVatop) || 0;
          const cVactTaa = Number(inv.cVactTaa) || 0;
          acc.acVatop += cVatop;
          acc.acVact += cVact;
          acc.acdVatop += cdVatop;
          acc.acVactTaa += cVactTaa;
          return acc;
        },
        { acVatop: 0, acVact: 0, acdVatop: 0, acVactTaa: 0 }
      );
      return res.status(200).json({
        investments: filteredInvestments,
        totals,
      });
    }

    return res.status(200).json(userData);
  } catch (error: any) {
    // If the file doesn't exist, return empty data structure (this is normal for new users)
    if (error.code === 'NoSuchKey' || error.statusCode === 404) {
      // Don't log - this is expected behavior for new users
      return res.status(200).json({
        investments: [],
        totals: {
          acVatop: 0,
          acVact: 0,
          acdVatop: 0,
          acVactTaa: 0,
        },
      });
    }
    
    const errorMessage = error.message || 'Could not fetch user data';
    console.error('Error fetching data:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
};

