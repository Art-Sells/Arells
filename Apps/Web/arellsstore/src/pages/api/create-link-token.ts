import type { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;

const config = new Configuration({
  basePath: PlaidEnvironments.production, // Use 'production' for production environment
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.NEXT_PUBLIC_PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.NEXT_PUBLIC_PLAID_SECRET!,
    },
  },
});

const client = new PlaidApi(config);

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  const userId = uuidv4(); // Generate a unique ID
  const key = `${email}/bank-account.json`;

  try {
    // Create the link token
    const response = await client.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Arells',
      products: [Products.Auth], // Ensure correct product types
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    const { request_id, link_token } = response.data;

    // Log the request_id
    console.log('Link token created. Request ID:', request_id);

    // Return the link token and request_id in the response
    return res.status(200).json({ link_token, request_id });
  } catch (error: any) {
    console.error('Error creating link token:', error);

    if (error.response) {
      const requestId = error.response.data.request_id || 'Unknown request_id';
      console.error('Error response from Plaid API:', error.response.data);

      // Log the request_id for this error
      console.log('Error Request ID:', requestId);

      return res.status(500).json({
        error: error.response.data.error_message,
        request_id: requestId, // Include it in the response for debugging
      });
    } else {
      const errorMessage = (error as Error).message || 'Failed to create link token';
      return res.status(500).json({ error: errorMessage });
    }
  }
};

export default handler;