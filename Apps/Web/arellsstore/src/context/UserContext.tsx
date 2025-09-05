'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AWS from 'aws-sdk';
import { fetchUserAttributes } from 'aws-amplify/auth';

interface UserContextType {
  email: string;
  setEmail: (email: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [email, setEmail] = useState<string>('');

  const s3 = new AWS.S3({
    accessKeyId: process.env.NEXT_PUBLIC_WS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_WS_SECRET_ACCESS_KEY,
    region: process.env.NEXT_PUBLIC_WS_REGION,
  });

  // Fetch the email and user attributes when the component mounts
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const attributesResponse = await fetchUserAttributes();
        const emailAttribute = attributesResponse.email;
        if (emailAttribute) {
          setEmail(emailAttribute);
        } else {
          console.warn('Email attribute not found.');
        }
      } catch (error) {
        console.error('Error fetching user attributes:', error);
      }
    };

    fetchUserEmail();
  }, []);

  return (
    <UserContext.Provider
      value={{
        email,
        setEmail,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};