// pages/api/getUserAttributes.ts
import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

AWS.config.update({ region: process.env.AWS_REGION });

const cognito = new AWS.CognitoIdentityServiceProvider();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Missing email' });
    }

    try {
        const response = await cognito.adminGetUser({
            UserPoolId: process.env.COGNITO_USER_POOL_ID!,
            Username: email as string,
        }).promise();

        const attributes: { [key: string]: string | undefined } = {};
        response.UserAttributes?.forEach(attribute => {
            attributes[attribute.Name] = attribute.Value;
        });

        return res.status(200).json(attributes);
    } catch (error) {
        console.error('Error fetching user attributes:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}