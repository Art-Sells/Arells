'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AWS from 'aws-sdk';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { createS3Folder } from '../../aws-config';

interface UserContextType {
  email: string;
  setEmail: (email: string) => void;
  bitcoinAddress: string;
  setBitcoinAddress: (address: string) => void;
  bitcoinPrivateKey: string;
  setBitcoinPrivateKey: (key: string) => void;
  fileCreated: boolean | null; // null: not checked, true: file exists, false: file created
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [email, setEmail] = useState<string>('');
  const [bitcoinAddress, setBitcoinAddress] = useState<string>('');
  const [bitcoinPrivateKey, setBitcoinPrivateKey] = useState<string>('');
  const [fileCreated, setFileCreated] = useState<boolean | null>(null);

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

  // Check for or create the aBTC.json file in S3
  useEffect(() => {
    const checkAndCreateBTCFile = async () => {
      if (!email) return;

      const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
      if (!bucketName) {
        console.error('S3 Bucket name is not defined in environment variables.');
        return;
      }

      const fileKey = `${email}/aBTC.json`;

      try {
        // Check if the file exists
        await s3.headObject({ Bucket: bucketName, Key: fileKey }).promise();
        setFileCreated(true); // File exists
      } catch (error: any) {
        if (error.code === 'NotFound') {
          console.log(`File ${fileKey} not found. Creating...`);
          // Create the file
          await createS3Folder(email, 'aBTC.json');
          setFileCreated(false); // File was created
        } else {
          console.error(`Error checking for file ${fileKey}: ${error.message}`);
          setFileCreated(null); // Error occurred
        }
      }
    };

    if (email) {
      checkAndCreateBTCFile();
    }
  }, [email]);

  return (
    <UserContext.Provider
      value={{
        email,
        setEmail,
        bitcoinAddress,
        setBitcoinAddress,
        bitcoinPrivateKey,
        setBitcoinPrivateKey,
        fileCreated,
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
