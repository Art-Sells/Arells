// /pages/api/exchange-public-token.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const config = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.NEXT_PUBLIC_PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.NEXT_PUBLIC_PLAID_SECRET!,
    },
  },
});

const client = new PlaidApi(config);

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { public_token } = req.body;
    const response = await client.itemPublicTokenExchange({ public_token });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};