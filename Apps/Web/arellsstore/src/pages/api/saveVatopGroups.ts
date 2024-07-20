import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const cognito = new AWS.CognitoIdentityServiceProvider();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Received request body:', req.body);

  const { email, vatopGroups, vatopCombinations, soldAmounts, acVactTas, transactions } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  let currentVatopCombinations = vatopCombinations;
  let currentSoldAmounts = 0;

  // Fetch existing user attributes if vatopCombinations or soldAmounts are not provided
  if (!vatopCombinations || soldAmounts === undefined) {
    console.log('Fetching existing user attributes');
    const userAttributes = await cognito.adminGetUser({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      Username: email,
    }).promise();

    const vatopCombinationsAttribute = userAttributes.UserAttributes?.find(attr => attr.Name === 'custom:vatopCombinations');
    currentVatopCombinations = vatopCombinationsAttribute?.Value ? JSON.parse(vatopCombinationsAttribute.Value) : {};

    const soldAmountsAttribute = userAttributes.UserAttributes?.find(attr => attr.Name === 'custom:soldAmounts');
    currentSoldAmounts = soldAmountsAttribute?.Value ? parseFloat(soldAmountsAttribute.Value) : 0;
    console.log('Fetched currentSoldAmounts:', currentSoldAmounts);
  }

  // Update only the acVactTas field if provided
  if (acVactTas !== undefined) {
    currentVatopCombinations.acVactTas = acVactTas;
  }

  // Reset or add to the existing sold amounts
  if (soldAmounts === 0) {
    console.log('Resetting currentSoldAmounts to zero');
    currentSoldAmounts = 0;
  } else if (soldAmounts !== undefined) {
    console.log('Adding soldAmounts:', soldAmounts, 'to currentSoldAmounts:', currentSoldAmounts);
    currentSoldAmounts += soldAmounts;
  }

  console.log('Final currentSoldAmounts:', currentSoldAmounts);

  // Prepare user attributes for update
  const userParams = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID!,
    Username: email,
    UserAttributes: [
      ...(vatopGroups ? [{
        Name: 'custom:vatopGroups',
        Value: JSON.stringify(vatopGroups),
      }] : []),
      {
        Name: 'custom:vatopCombinations',
        Value: JSON.stringify(currentVatopCombinations),
      },
      {
        Name: 'custom:soldAmounts',
        Value: String(currentSoldAmounts),
      },
      {
        Name: 'custom:Transactions',
        Value: JSON.stringify(transactions),
      },
    ],
  };

  try {
    console.log('Attempting to update user attributes with params:', JSON.stringify(userParams, null, 2));
    await cognito.adminUpdateUserAttributes(userParams).promise();
    console.log('Update successful');
    return res.status(200).json({ message: 'Attributes updated successfully' });
  } catch (error) {
    console.error('Error updating user attributes:', error);
    return res.status(500).json({ error: 'Failed to update user attributes' });
  }
};

export default handler;