// pages/api/saveVavityConnection.ts

import type { NextApiRequest, NextApiResponse } from 'next';

import AWS from 'aws-sdk';



const s3 = new AWS.S3();

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;



interface VavityConnection {

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

    // Save vavity connection

    const { email, vavityConnection } = req.body as {

      email: string;

      vavityConnection: VavityConnection;

    };



    if (!email || !vavityConnection) {

      return res.status(400).json({ error: 'Email and vavityConnection are required' });

    }



    const key = `${email}/VavityConnection.json`;



    try {

      // Fetch existing vavity connections

      let vavityConnections: VavityConnection[] = [];

      try {

        const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();

        if (response.Body) {

          vavityConnections = JSON.parse(response.Body.toString());
        }

      } catch (error: any) {

        if (error.code !== 'NoSuchKey') {

          throw error;

        }

        // File doesn't exist yet, start with empty array

      }



      // Remove any existing connection with same address and walletType

      vavityConnections = vavityConnections.filter(

        (vc) => !(vc.address.toLowerCase() === vavityConnection.address.toLowerCase() && vc.walletType === vavityConnection.walletType)

      );



      // Add new vavity connection

      // Build connection object with defaults, but preserve explicitly set values

      // CRITICAL: Remove old fields BEFORE building the object to prevent them from affecting new fields

      const cleanVavityConnection = { ...vavityConnection };

      delete (cleanVavityConnection as any).depositCompleted;

      delete (cleanVavityConnection as any).depositCancelled;

      delete (cleanVavityConnection as any).walletExtensionConnected;

      delete (cleanVavityConnection as any).walletConnectionCanceled;

      delete (cleanVavityConnection as any).assetConnectionCancelled;

      // Remove VAPA if it exists (now stored in separate API)
      delete (cleanVavityConnection as any).vapa;

      const connectionToAdd: any = {

        ...cleanVavityConnection,

        timestamp: cleanVavityConnection.timestamp || Date.now(),

        // Default values for boolean fields if not provided (backward compatibility)

        assetConnected: (cleanVavityConnection as any).assetConnected ?? false,

      };
      
      // Remove walletConnecting, assetConnecting, and walletConnected if they exist (cleanup old data)
      delete connectionToAdd.walletConnecting;
      delete connectionToAdd.assetConnecting;
      delete connectionToAdd.walletConnected;

      

      // Migrate old depositCompleted field if present

      if ((vavityConnection as any).depositCompleted !== undefined && connectionToAdd.assetConnected === false) {

        connectionToAdd.assetConnected = (vavityConnection as any).depositCompleted;

      }

      

      vavityConnections.push(connectionToAdd);



      // Save to S3

      await s3.putObject({

        Bucket: BUCKET_NAME,

        Key: key,

        Body: JSON.stringify(vavityConnections),

        ContentType: 'application/json',

      }).promise();



      return res.status(200).json({ message: 'Vavity connection saved successfully' });

    } catch (error: any) {

      console.error('Error saving vavity connection:', error);

      return res.status(500).json({ error: 'Failed to save vavity connection', details: error.message });

    }

  } else if (req.method === 'GET') {

    // Get vavity connections

    const { email } = req.query as { email: string };



    if (!email) {

      return res.status(400).json({ error: 'Email query parameter is required' });

    }



    const key = `${email}/VavityConnection.json`;



    try {
      const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();

      if (response.Body) {
        const vavityConnections = JSON.parse(response.Body.toString());

        // Read-only: Return connections as-is (assetConnected is updated by saveVavityAggregator)
        // No calculations or transformations here

        return res.status(200).json({ 
          vavityConnections
        });

      } else {

        return res.status(200).json({ vavityConnections: [] });

      }

    } catch (error: any) {

      if (error.code === 'NoSuchKey') {

        return res.status(200).json({ vavityConnections: [] });

      }

      console.error('Error fetching vavity connections:', error);

      return res.status(500).json({ error: 'Failed to fetch vavity connections', details: error.message });

    }

  } else if (req.method === 'DELETE') {

    // Remove vavity connection

    const { email, address, walletType } = req.body as {

      email: string;

      address: string;

      walletType: 'metamask' | 'base';

    };



    if (!email || !address || !walletType) {

      return res.status(400).json({ error: 'Email, address, and walletType are required' });

    }



    const key = `${email}/VavityConnection.json`;



    try {

      // Fetch existing vavity connections

      let vavityConnections: VavityConnection[] = [];

      try {

        const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();

        if (response.Body) {

          vavityConnections = JSON.parse(response.Body.toString());

        }

      } catch (error: any) {

        if (error.code !== 'NoSuchKey') {

          throw error;

        }

        return res.status(200).json({ message: 'No vavity connections to remove' });

      }



      // Remove connection with matching address and walletType

      const initialLength = vavityConnections.length;

      vavityConnections = vavityConnections.filter(

        (vc) => !(vc.address.toLowerCase() === address.toLowerCase() && vc.walletType === walletType)

      );



      if (vavityConnections.length === initialLength) {

        return res.status(404).json({ error: 'Vavity connection not found' });

      }



      // Save updated list to S3

      await s3.putObject({

        Bucket: BUCKET_NAME,

        Key: key,

        Body: JSON.stringify(vavityConnections),

        ContentType: 'application/json',

      }).promise();



      return res.status(200).json({ message: 'Vavity connection removed successfully' });

    } catch (error: any) {

      console.error('Error removing vavity connection:', error);

      return res.status(500).json({ error: 'Failed to remove vavity connection', details: error.message });

    }

  } else {

    return res.status(405).json({ error: 'Method Not Allowed' });

  }

}

