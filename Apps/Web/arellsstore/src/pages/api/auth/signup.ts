// pages/api/auth/signup.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { findUser } from './[...nextauth]';
import bcrypt from 'bcrypt';
import { AppUser } from './[...nextauth]';
import { v4 as uuidv4 } from 'uuid';
import { dynamoDb } from '../../../../aws-config';


export default async function signup(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { email, password } = req.body;

    // Validate the input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await findUser(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser: AppUser = {
        email, password: hashedPassword,
        id: ''
    };
    await createUser(newUser);

    res.status(200).json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


export async function createUser(user: Omit<AppUser, 'id'>): Promise<AppUser> {
    const userId = uuidv4(); // Generate a new UUID
    const newUser: AppUser = {
      ...user,
      id: userId,
    };
  
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME as string,
      Item: newUser,
    };
  
    await dynamoDb.put(params).promise();
    return newUser;
  }
