"use strict";
require("dotenv/config");
const AWS = require("aws-sdk");
const sharp = require("sharp");

// Dynamic import for node-fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const GRAPH_URL = process.env.NEXT_PUBLIC_GRAPH_URL;

// AWS S3 Configuration
AWS.config.update({ region: 'us-west-1' });
const s3 = new AWS.S3();
const S3_BUCKET = 'arellsnftcdn';

const QUERY = `
  query GetCreatedNFTs {
    nfts {
      tokenURI
    }
  }
`;

// Function to fetch NFTs from GraphQL Endpoint
async function fetchNFTs() {
    try {
        const response = await fetch(GRAPH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: QUERY })
        });
        const json = await response.json();
        return json.data.nfts;
    } catch (error) {
        console.error('Error fetching NFT data:', error);
        return null;
    }
}

// Function to extract the unique part of the token URI
function extractTokenId(tokenURI) {
    const parts = tokenURI.split('/');
    return parts[parts.length - 1]; // Returns the last part of the URI
}

// Function to process and upload each image
async function processAndUploadImage(tokenURI) {
    try {
        let response = await fetch(tokenURI);
        if (!response.ok) {
            throw new Error(`Failed to fetch token metadata: ${response.statusText}`);
        }

        const metadata = await response.json();
        const imageUrl = metadata.image;

        if (typeof imageUrl !== 'string') {
            throw new Error('Invalid image URL in metadata');
        }

        response = await fetch(imageUrl);
        if (!response.ok || !response.headers.get('content-type').includes('image')) {
            throw new Error(`URL did not point to an image: ${response.statusText}`);
        }

        const imageBuffer = await response.buffer();
        const processedImage = await sharp(imageBuffer)
            .resize(800, 800)
            .toBuffer();

        const tokenId = extractTokenId(tokenURI);
        const imageKey = `image-${tokenId}.jpg`;

        await s3.upload({
            Bucket: S3_BUCKET,
            Key: imageKey,
            Body: processedImage,
            ContentType: 'image/jpeg'
        }).promise();
        console.log(`Uploaded image with key: ${imageKey}`);
    } catch (error) {
        console.error(`Error processing image from ${tokenURI}:`, error);
    }
}

// Main function to start the process
async function startProcessing() {
    const nfts = await fetchNFTs();
    if (nfts) {
        for (const nft of nfts) {
            await processAndUploadImage(nft.tokenURI);
        }
    }
}

// Call the function to start processing
startProcessing();
