import type { NextApiRequest, NextApiResponse } from 'next';

// Simulate a database for storing users
const users: Array<{ email: string; password: string; address: string; privateKey: string }> = [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email, password, address, privateKey } = req.body;

    if (!email || !password || !address || !privateKey) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Check if the user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Save the new user
    users.push({ email, password, address, privateKey });
    return res.status(201).json({ message: 'User created successfully' });
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}