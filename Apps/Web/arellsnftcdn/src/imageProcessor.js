"use strict";
require("dotenv/config");
const AWS = require("aws-sdk");
const sharp_1 = __importDefault(require("sharp"));

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
        // Use the GraphQLResponse interface to assert the type of the JSON response
        const json = await response.json();
        return json.data.nfts;
    } catch (error) {
        console.error('Error fetching NFT data:', error);
        return null;
    }
}

// Function to process and upload each image
async function processAndUploadImage(imageUrl) {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType.includes('image')) {
            throw new Error(`URL did not point to an image: ${contentType}`);
        }

        const imageBuffer = await response.buffer();
        // Process the image with sharp
        const processedImage = await sharp(imageBuffer)
            .resize(800, 800)
            .toBuffer();
        // Generate a unique key for S3
        const imageKey = `image-${Date.now()}.jpg`;
        // Upload to S3
        await s3.upload({
            Bucket: S3_BUCKET,
            Key: imageKey,
            Body: processedImage,
            ContentType: 'image/jpeg'
        }).promise();
        console.log(`Uploaded image with key: ${imageKey}`);
    } catch (error) {
        console.error(`Error processing image from ${imageUrl}:`, error);
    }
}


// Main function to start the process
async function startProcessing() {
    const nfts = await fetchNFTs();
    if (nfts) {
        nfts.forEach(nft => {
            processAndUploadImage(nft.tokenURI);
        });
    }
}

// Call the function to start processing
startProcessing();

function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
