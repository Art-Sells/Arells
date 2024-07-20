import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const cognito = new AWS.CognitoIdentityServiceProvider();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Received request body:', req.body);

  const { email, vatopGroups, vatopCombinations, soldAmounts } = req.body;

  if (!email || !vatopGroups || !vatopCombinations || soldAmounts === undefined) {
    return res.status(400).json({ error: 'Missing email, vatopGroups, vatopCombinations, or soldAmounts' });
  }

  // Validate and parse vatopGroups
  for (const group of vatopGroups) {
    if (typeof group.cVactTa === 'string') {
      group.cVactTa = parseFloat(group.cVactTa).toString(); // Ensure it remains a string
    }
    // Add any other necessary conversions and validations here
  }

  // Ensure acVactTas remains a string and validate it
  if (typeof vatopCombinations.acVactTas !== 'string' || isNaN(parseFloat(vatopCombinations.acVactTas))) {
    console.error('acVactTas must be a valid number in string format');
    return res.status(400).json({ error: 'acVactTas must be a valid number in string format' });
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
      {
        Name: 'custom:soldAmounts',
        Value: String(soldAmounts), // Convert to string to store in Cognito
      },
    ],
  };

  try {
    console.log('Attempting to update user attributes with params:', userParams);
    await cognito.adminUpdateUserAttributes(userParams).promise();
    return res.status(200).json({ message: 'Attributes updated successfully' });
  } catch (error) {
    console.error('Error updating user attributes:', error);
    return res.status(500).json({ error: 'Failed to update user attributes' });
  }
};

export default handler;