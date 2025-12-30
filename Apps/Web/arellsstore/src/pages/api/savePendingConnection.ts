// pages/api/savePendingConnection.ts

import type { NextApiRequest, NextApiResponse } from 'next';

import AWS from 'aws-sdk';



const s3 = new AWS.S3();

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;



interface PendingConnection {

  address: string;

  walletId: string;

  walletType: 'metamask' | 'base';

  timestamp: number;

  txHash?: string; // Store transaction hash when deposit completes

  

  // Asset connection states

  assetConnected: boolean; // true after successful asset connection (deposit), false after disconnection

}



export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method === 'POST') {

    // Save pending connection

    const { email, pendingConnection } = req.body as {

      email: string;

      pendingConnection: PendingConnection;

    };



    if (!email || !pendingConnection) {

      return res.status(400).json({ error: 'Email and pendingConnection are required' });

    }



    const key = `${email}/pendingConnections.json`;



    try {

      // Fetch existing pending connections

      let pendingConnections: PendingConnection[] = [];

      try {

        const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();

        if (response.Body) {

          pendingConnections = JSON.parse(response.Body.toString());

        }

      } catch (error: any) {

        if (error.code !== 'NoSuchKey') {

          throw error;

        }

        // File doesn't exist yet, start with empty array

      }



      // Remove any existing connection with same address and walletType

      pendingConnections = pendingConnections.filter(

        (pc) => !(pc.address.toLowerCase() === pendingConnection.address.toLowerCase() && pc.walletType === pendingConnection.walletType)

      );



      // Add new pending connection

      // Build connection object with defaults, but preserve explicitly set values

      // CRITICAL: Remove old fields BEFORE building the object to prevent them from affecting new fields

      const cleanPendingConnection = { ...pendingConnection };

      delete (cleanPendingConnection as any).depositCompleted;

      delete (cleanPendingConnection as any).depositCancelled;

      delete (cleanPendingConnection as any).walletExtensionConnected;

      delete (cleanPendingConnection as any).walletConnectionCanceled;

      delete (cleanPendingConnection as any).assetConnectionCancelled;

      

      const connectionToAdd: any = {

        ...cleanPendingConnection,

        timestamp: cleanPendingConnection.timestamp || Date.now(),

        // Default values for boolean fields if not provided (backward compatibility)

        assetConnected: (cleanPendingConnection as any).assetConnected ?? false,

      };
      
      // Remove walletConnecting, assetConnecting, and walletConnected if they exist (cleanup old data)
      delete connectionToAdd.walletConnecting;
      delete connectionToAdd.assetConnecting;
      delete connectionToAdd.walletConnected;

      

      // Migrate old depositCompleted field if present

      if ((pendingConnection as any).depositCompleted !== undefined && connectionToAdd.assetConnected === false) {

        connectionToAdd.assetConnected = (pendingConnection as any).depositCompleted;

      }

      

      pendingConnections.push(connectionToAdd);



      // Save to S3

      await s3.putObject({

        Bucket: BUCKET_NAME,

        Key: key,

        Body: JSON.stringify(pendingConnections),

        ContentType: 'application/json',

      }).promise();



      return res.status(200).json({ message: 'Pending connection saved successfully' });

    } catch (error: any) {

      console.error('Error saving pending connection:', error);

      return res.status(500).json({ error: 'Failed to save pending connection', details: error.message });

    }

  } else if (req.method === 'GET') {

    // Get pending connections

    const { email } = req.query as { email: string };



    if (!email) {

      return res.status(400).json({ error: 'Email query parameter is required' });

    }



    const key = `${email}/pendingConnections.json`;



    try {

      const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();

      

      if (response.Body) {

        const pendingConnections = JSON.parse(response.Body.toString());

        return res.status(200).json({ pendingConnections });

      } else {

        return res.status(200).json({ pendingConnections: [] });

      }

    } catch (error: any) {

      if (error.code === 'NoSuchKey') {

        return res.status(200).json({ pendingConnections: [] });

      }

      console.error('Error fetching pending connections:', error);

      return res.status(500).json({ error: 'Failed to fetch pending connections', details: error.message });

    }

  } else if (req.method === 'DELETE') {

    // Remove pending connection

    const { email, address, walletType } = req.body as {

      email: string;

      address: string;

      walletType: 'metamask' | 'base';

    };



    if (!email || !address || !walletType) {

      return res.status(400).json({ error: 'Email, address, and walletType are required' });

    }



    const key = `${email}/pendingConnections.json`;



    try {

      // Fetch existing pending connections

      let pendingConnections: PendingConnection[] = [];

      try {

        const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();

        if (response.Body) {

          pendingConnections = JSON.parse(response.Body.toString());

        }

      } catch (error: any) {

        if (error.code !== 'NoSuchKey') {

          throw error;

        }

        return res.status(200).json({ message: 'No pending connections to remove' });

      }



      // Remove connection with matching address and walletType

      const initialLength = pendingConnections.length;

      pendingConnections = pendingConnections.filter(

        (pc) => !(pc.address.toLowerCase() === address.toLowerCase() && pc.walletType === walletType)

      );



      if (pendingConnections.length === initialLength) {

        return res.status(404).json({ error: 'Pending connection not found' });

      }



      // Save updated list to S3

      await s3.putObject({

        Bucket: BUCKET_NAME,

        Key: key,

        Body: JSON.stringify(pendingConnections),

        ContentType: 'application/json',

      }).promise();



      return res.status(200).json({ message: 'Pending connection removed successfully' });

    } catch (error: any) {

      console.error('Error removing pending connection:', error);

      return res.status(500).json({ error: 'Failed to remove pending connection', details: error.message });

    }

  } else {

    return res.status(405).json({ error: 'Method Not Allowed' });

  }

}
