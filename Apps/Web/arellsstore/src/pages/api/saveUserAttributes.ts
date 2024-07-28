// pages/api/saveUserAttributes.ts
import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

AWS.config.update({ region: process.env.AWS_REGION });

const cognito = new AWS.CognitoIdentityServiceProvider();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, vatopGroups, vatopCombinations } = req.body;

    if (!email || !vatopGroups || !vatopCombinations) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    try {
        await cognito.adminUpdateUserAttributes({
            UserPoolId: process.env.COGNITO_USER_POOL_ID!,
            Username: email,
            UserAttributes: [
                { Name: 'custom:vatopGroups', Value: JSON.stringify(vatopGroups) },
                { Name: 'custom:vatopCombinations', Value: JSON.stringify(vatopCombinations) }
            ]
        }).promise();

        return res.status(200).json({ message: 'Attributes updated successfully' });
    } catch (error) {
        console.error('Error updating attributes:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}