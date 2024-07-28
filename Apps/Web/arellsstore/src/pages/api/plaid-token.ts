import type { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.NEXT_PUBLIC_PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.NEXT_PUBLIC_PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { public_token } = req.body;
  try {
    const tokenResponse = await client.itemPublicTokenExchange({ public_token });
    res.status(200).json(tokenResponse.data);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};