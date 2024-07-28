import type { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;

console.log('PLAID_CLIENT_ID:', process.env.NEXT_PUBLIC_PLAID_CLIENT_ID);
console.log('PLAID_SECRET:', process.env.NEXT_PUBLIC_PLAID_SECRET);

const config = new Configuration({
  basePath: PlaidEnvironments.sandbox, // Use 'production' for production environment
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
      products: [Products.Auth, Products.Transactions], // Ensure correct product types
      country_codes: [
        CountryCode.Us, CountryCode.Gb, CountryCode.Es, CountryCode.Nl, 
        CountryCode.Fr, CountryCode.Ie, CountryCode.Ca, CountryCode.De, 
        CountryCode.It, CountryCode.Pl, CountryCode.Dk, CountryCode.No, 
        CountryCode.Se, CountryCode.Ee, CountryCode.Lt, CountryCode.Lv, 
        CountryCode.Pt, CountryCode.Be
      ],
      language: 'en',
    });

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Error creating link token:', error);
    if (error.response) {
      console.error('Error response from Plaid API:', error.response.data);
      return res.status(500).json({ error: error.response.data.error_message });
    } else {
      const errorMessage = (error as Error).message || 'Failed to create link token';
      return res.status(500).json({ error: errorMessage });
    }
  }
};

export default handler;