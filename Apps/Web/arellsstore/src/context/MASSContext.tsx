'use client';
require('dotenv').config(); // Load .env variables

import React, { createContext, useContext, useState, useEffect } from 'react';
import AWS from 'aws-sdk';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { createS3Folder } from '../../aws-config';

interface MASSContextType {
  email: string;
  fileCreated: boolean | null; // null: not checked, true: file exists, false: file created
}

const MASSContext = createContext<MASSContextType | undefined>(undefined);

export const MASSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [email, setEmail] = useState<string>('');
  const [fileCreated, setFileCreated] = useState<boolean | null>(null); // Track file creation status
  const s3 = new AWS.S3({
    accessKeyId: process.env.NEXT_PUBLIC_WS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_WS_SECRET_ACCESS_KEY,
    region: process.env.NEXT_PUBLIC_WS_REGION,
  });

  useEffect(() => {
    // Fetch the email when the component mounts
    const fetchEmail = async () => {
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

    fetchEmail();
  }, []);

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
    <MASSContext.Provider
      value={{
        email,
        fileCreated,
      }}
    >
      {children}
    </MASSContext.Provider>
  );
};

export const useMASS = () => {
  const context = useContext(MASSContext);
  if (context === undefined) {
    throw new Error('useMASS must be used within a MASSProvider');
  }
  return context;
};