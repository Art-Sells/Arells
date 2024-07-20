import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const cognito = new AWS.CognitoIdentityServiceProvider();

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email query parameter is required' });
  }

  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID!,
    Username: email as string,
  };

  try {
    const data = await cognito.adminGetUser(params).promise();
    const vatopGroupsAttr = data.UserAttributes?.find(attr => attr.Name === 'custom:vatopGroups');
    const vatopCombinationsAttr = data.UserAttributes?.find(attr => attr.Name === 'custom:vatopCombinations');
    const soldAmountsAttr = data.UserAttributes?.find(attr => attr.Name === 'custom:soldAmounts');// Add this line

    let vatopGroups = [];
    let vatopCombinations = {
      acVatops: 0,
      acVacts: 0,
      acVactTas: 0,
      acdVatops: 0,
      acVactsAts: 0,
      acVactTaAts: 0,
    };
    let soldAmounts = 0;  // Add this line

    if (vatopGroupsAttr) {
      vatopGroups = JSON.parse(vatopGroupsAttr.Value || '[]');
    }

    if (vatopCombinationsAttr) {
      vatopCombinations = JSON.parse(vatopCombinationsAttr.Value || '{}');
    }

    if (soldAmountsAttr) {  // Add this line
      soldAmounts = parseFloat(soldAmountsAttr.Value || '0');  // Add this line
    }

    return res.status(200).json({ vatopGroups, vatopCombinations, soldAmounts });  // Add soldAmount to response
  } catch (error) {
    console.error('Error fetching user attributes:', error);
    return res.status(500).json({ error: 'Could not fetch vatop groups' });
  }
};