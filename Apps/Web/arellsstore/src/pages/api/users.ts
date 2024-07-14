// pages/api/user.ts
import type { NextApiRequest, NextApiResponse } from 'next';

// Simulate a database for storing users
const users: Array<{ email: string; password: string; bitcoinAddress: string; bitcoinPrivateKey: string, vatopGroups: any[] }> = [];

// Get user data by email
const getUserByEmail = (email: string) => {
  return users.find(user => user.email === email);
};

// Update user data by email
const updateUserByEmail = (email: string, vatopGroups: any[]) => {
  const userIndex = users.findIndex(user => user.email === email);
  if (userIndex !== -1) {
    users[userIndex].vatopGroups = vatopGroups;
  }
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email, vatopGroups } = req.body;

  if (req.method === 'GET') {
    const user = getUserByEmail(email);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } else if (req.method === 'PUT') {
    if (!email || !vatopGroups) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    updateUserByEmail(email, vatopGroups);
    return res.status(200).json({ message: 'User updated successfully' });
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}