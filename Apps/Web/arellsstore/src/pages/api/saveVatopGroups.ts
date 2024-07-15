import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const cognito = new AWS.CognitoIdentityServiceProvider();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, vatopGroups, vatopCombinations } = req.body;

  if (!email || !vatopGroups || !vatopCombinations) {
    return res.status(400).json({ error: 'Missing email, vatopGroups, or vatopCombinations' });
  }

  const userParams = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID!,
    Username: email,
    UserAttributes: [
      {
        Name: 'custom:vatopGroups',
        Value: JSON.stringify(vatopGroups),
      },
      {
        Name: 'custom:vatopCombinations',
        Value: JSON.stringify(vatopCombinations),
      },
    ],
  };

  try {
    await cognito.adminUpdateUserAttributes(userParams).promise();
    return res.status(200).json({ message: 'Attributes updated successfully' });
  } catch (error) {
    console.error('Error updating user attributes:', error);
    return res.status(500).json({ error: 'Failed to update user attributes' });
  }
};

export default handler;