// /pages/api/create-link-token.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

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

// Get all country codes from the CountryCode enum
const allCountryCodes = Object.values(CountryCode);

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const response = await client.linkTokenCreate({
      user: { client_user_id: req.body.email },
      client_name: 'Your App Name',
      products: [Products.Transactions, Products.Auth], // Ensure correct product types
      country_codes: allCountryCodes,
      language: 'en',
    });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};