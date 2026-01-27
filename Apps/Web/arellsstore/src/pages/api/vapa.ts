// pages/api/vapa.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import axios from 'axios';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const VAPA_KEY = 'vavity/VAPA.json';

/**
 * Fetch current Bitcoin price and update VAPA if higher
 * This ensures VAPA is always up-to-date and never decreases
 */
async function fetchAndUpdateVAPA(): Promise<number> {
  // First, check if file exists - if not, we'll create it
  let storedVAPA = 0;
  let fileExists = false;
  try {
    const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: VAPA_KEY }).promise();
    if (response.Body) {
      const data = JSON.parse(response.Body.toString());
      storedVAPA = data.vapa || 0;
      fileExists = true;
    }
  } catch (error: any) {
    if (error.code !== 'NoSuchKey') {
      console.error('[vapa] Error fetching stored VAPA:', error);
    }
    fileExists = false;
  }
  
  try {
    // Fetch current Bitcoin price
    let currentPrice = 0;
    try {
      const currentPriceResponse = await axios.get('http://localhost:3000/api/fetchBitcoinPrice', { 
        timeout: 3000 
      }).catch(() => {
        // Try relative URL if localhost fails (for production)
        return axios.get('/api/fetchBitcoinPrice', { timeout: 3000 });
      });
      currentPrice = currentPriceResponse.data?.bitcoin?.usd || 0;
    } catch (error) {
      console.warn('[vapa] Failed to fetch current price, using stored value or 0');
    }
    
    // Also fetch highest price ever as backup
    let highestPriceEver = 0;
    try {
      const highestPriceResponse = await axios.get('http://localhost:3000/api/fetchHighestBitcoinPrice', { 
        timeout: 3000 
      }).catch(() => {
        // Try relative URL if localhost fails (for production)
        return axios.get('/api/fetchHighestBitcoinPrice', { timeout: 3000 });
      });
      highestPriceEver = highestPriceResponse.data?.highestPriceEver || 0;
    } catch (error) {
      // Ignore errors - use current price only
    }
    
    // Calculate new VAPA: use Math.max to ensure it never decreases
    const newVAPA = Math.max(
      storedVAPA,      // Current stored VAPA (never decreases)
      currentPrice,    // Current Bitcoin price
      highestPriceEver // Highest price ever (backup)
    );
    
    // ALWAYS create the file if it doesn't exist, OR update if new VAPA is higher
    if (!fileExists) {
      // File doesn't exist - create it with current VAPA (even if 0)
      await s3.putObject({
        Bucket: BUCKET_NAME,
        Key: VAPA_KEY,
        Body: JSON.stringify({ vapa: newVAPA, lastUpdated: Date.now() }),
        ContentType: 'application/json',
      }).promise();
      console.log('[vapa] Created VAPA file:', { vapa: newVAPA });
    } else if (newVAPA > storedVAPA) {
      // File exists - only update if new VAPA is higher
      await s3.putObject({
        Bucket: BUCKET_NAME,
        Key: VAPA_KEY,
        Body: JSON.stringify({ vapa: newVAPA, lastUpdated: Date.now() }),
        ContentType: 'application/json',
      }).promise();
      console.log('[vapa] Updated VAPA:', { old: storedVAPA, new: newVAPA });
    }
    
    return newVAPA;
  } catch (error: any) {
    console.error('[vapa] Error fetching/updating VAPA:', error);
    // Try to get stored VAPA if available
    let storedVAPA = 0;
    let fileExists = false;
    try {
      const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: VAPA_KEY }).promise();
      if (response.Body) {
        const data = JSON.parse(response.Body.toString());
        storedVAPA = data.vapa || 0;
        fileExists = true;
      }
    } catch (err: any) {
      // File doesn't exist - create it with 0 as fallback
      if (err.code === 'NoSuchKey') {
        try {
          await s3.putObject({
            Bucket: BUCKET_NAME,
            Key: VAPA_KEY,
            Body: JSON.stringify({ vapa: 0, lastUpdated: Date.now() }),
            ContentType: 'application/json',
          }).promise();
          console.log('[vapa] Created VAPA file with fallback value 0 due to error');
        } catch (createError) {
          console.error('[vapa] Failed to create VAPA file even with fallback:', createError);
        }
      }
    }
    return storedVAPA;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // GET: Fetch current VAPA (auto-updates if price is higher)
    try {
      // First, ensure file exists - create it if it doesn't
      let fileExists = false;
      try {
        await s3.headObject({ Bucket: BUCKET_NAME, Key: VAPA_KEY }).promise();
        fileExists = true;
      } catch (error: any) {
        if (error.code === 'NoSuchKey') {
          // File doesn't exist - create it immediately with initial value
          const initialVapa = 0;
          await s3.putObject({
            Bucket: BUCKET_NAME,
            Key: VAPA_KEY,
            Body: JSON.stringify({ vapa: initialVapa, lastUpdated: Date.now() }),
            ContentType: 'application/json',
          }).promise();
          console.log('[vapa] Created VAPA file on first GET request');
          // Now fetch and update with actual price
          const vapa = await fetchAndUpdateVAPA();
          return res.status(200).json({ vapa });
        } else {
          throw error;
        }
      }
      
      // File exists - fetch and update
      const vapa = await fetchAndUpdateVAPA();
      return res.status(200).json({ vapa });
    } catch (error: any) {
      console.error('[vapa] Error in GET handler:', error);
      // Even on error, try to return stored value or create file
      try {
        const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: VAPA_KEY }).promise();
        if (response.Body) {
          const data = JSON.parse(response.Body.toString());
          return res.status(200).json({ vapa: data.vapa || 0 });
        }
      } catch (err: any) {
        // File doesn't exist - create it with 0
        if (err.code === 'NoSuchKey') {
          await s3.putObject({
            Bucket: BUCKET_NAME,
            Key: VAPA_KEY,
            Body: JSON.stringify({ vapa: 0, lastUpdated: Date.now() }),
            ContentType: 'application/json',
          }).promise();
          return res.status(200).json({ vapa: 0 });
        }
      }
      return res.status(500).json({ error: 'Failed to fetch VAPA', details: error.message });
    }
  } else if (req.method === 'POST') {
    // POST: Update VAPA (only if new value is higher)
    const { vapa: requestedVAPA } = req.body as { vapa?: number };
    
    try {
      // Get current stored VAPA
      let storedVAPA = 0;
      let fileExists = false;
      try {
        const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: VAPA_KEY }).promise();
        if (response.Body) {
          const data = JSON.parse(response.Body.toString());
          storedVAPA = data.vapa || 0;
          fileExists = true;
        }
      } catch (error: any) {
        if (error.code !== 'NoSuchKey') {
          throw error;
        }
        // File doesn't exist yet - will create it
        fileExists = false;
      }
      
      // Also fetch current price to ensure we have the latest
      const currentVAPA = await fetchAndUpdateVAPA();
      
      // Use Math.max to ensure VAPA never decreases
      const finalVAPA = Math.max(
        storedVAPA,
        currentVAPA,
        requestedVAPA || 0
      );
      
      // ALWAYS create the file if it doesn't exist, OR update if final VAPA is higher
      if (!fileExists) {
        // File doesn't exist - create it with final VAPA (even if 0)
        await s3.putObject({
          Bucket: BUCKET_NAME,
          Key: VAPA_KEY,
          Body: JSON.stringify({ vapa: finalVAPA, lastUpdated: Date.now() }),
          ContentType: 'application/json',
        }).promise();
        console.log('[vapa] Created VAPA file via POST:', { vapa: finalVAPA });
      } else if (finalVAPA > storedVAPA) {
        // File exists - only update if final VAPA is higher
        await s3.putObject({
          Bucket: BUCKET_NAME,
          Key: VAPA_KEY,
          Body: JSON.stringify({ vapa: finalVAPA, lastUpdated: Date.now() }),
          ContentType: 'application/json',
        }).promise();
        console.log('[vapa] Updated VAPA via POST:', { old: storedVAPA, new: finalVAPA });
      }
      
      return res.status(200).json({ vapa: finalVAPA });
    } catch (error: any) {
      console.error('[vapa] Error in POST handler:', error);
      return res.status(500).json({ error: 'Failed to update VAPA', details: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}

