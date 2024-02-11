// pages/api/auth/signin.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import { findUser } from './[...nextauth]'; // Adjust path as necessary

export default async function signin(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await findUser(email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const match = await bcrypt.compare(password, user.password || '');
        if (!match) {
            // Passwords do not match
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        

        res.status(200).json({ message: 'Sign-in successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
