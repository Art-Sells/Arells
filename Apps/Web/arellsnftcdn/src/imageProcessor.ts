import 'dotenv/config';

const GRAPH_URL = process.env.NEXT_PUBLIC_GRAPH_URL as string;

// AWS S3 Configuration
AWS.config.update({ region: 'us-west-1' });
const s3 = new AWS.S3();
const S3_BUCKET = 'arellsnftcdn';

import 'dotenv/config';
import * as AWS from 'aws-sdk';
import fetch, { RequestInfo } from 'node-fetch';
import sharp from 'sharp';


const QUERY = `
  query GetCreatedNFTs {
    nfts {
      id
      tokenURI
    }
  }
`;

// Define the GraphQL response structure
interface GraphQLResponse {
    data: {
      nfts: {
        id: string;
        tokenURI: string;
      }[];
    }
  }
  
  // Function to fetch NFTs from GraphQL Endpoint
  async function fetchNFTs() {
    try {
      const response = await fetch(GRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: QUERY })
      });
  
      // Use the GraphQLResponse interface to assert the type of the JSON response
      const json = await response.json() as GraphQLResponse;
      return json.data.nfts;
    } catch (error) {
      console.error('Error fetching NFT data:', error);
      return null;
    }
  }
  
  

// Function to process and upload each image
async function processAndUploadImage(nftId: any, imageUrl: URL | RequestInfo) {
  try {
    const response = await fetch(imageUrl);
    const imageBuffer = await response.buffer();

    // Process the image with sharp
    const processedImage = await sharp(imageBuffer)
      .resize(800, 800)
      .toBuffer();

    // Upload to S3
    await s3.upload({
      Bucket: S3_BUCKET,
      Key: `${nftId}.jpg`,
      Body: processedImage,
      ContentType: 'image/jpeg'
    }).promise();

    console.log(`Uploaded image for NFT ID: ${nftId}`);
  } catch (error) {
    console.error(`Error processing image for NFT ID: ${nftId}:`, error);
  }
}

// Main function to start the process
async function startProcessing() {
  const nfts = await fetchNFTs();
  if (nfts) {
    nfts.forEach((nft: { id: any; tokenURI: URL | RequestInfo; }) => {
      processAndUploadImage(nft.id, nft.tokenURI);
    });
  }
}

// Call the function to start processing
startProcessing();