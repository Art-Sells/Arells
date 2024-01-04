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

async function fetchNFTs(batchSize = 100) {
    let allNFTs = [];
    let skip = 0;
    let fetched = 0;

    do {
        const QUERY = `
          query GetCreatedNFTs($skip: Int) {
            nfts(orderBy: id, first: ${batchSize}, skip: $skip) {
              id
              tokenURI
            }
          }
        `;

        try {
            const response = await fetch(GRAPH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: QUERY, variables: { skip: skip } })
            });
            const json = await response.json();

            if (json.data && json.data.nfts) {
                fetched = json.data.nfts.length;
                allNFTs.push(...json.data.nfts);
                skip += fetched;
            } else {
                fetched = 0;
            }

        } catch (error) {
            break;
        }

    } while (fetched === batchSize);

    console.log(`Fetched a total of ${allNFTs.length} NFTs`);
    return allNFTs;
}

function extractTokenId(tokenURI) {
    const parts = tokenURI.split('/');
    return parts[parts.length - 1];
}

async function processAndUploadImage(tokenURI) {
    console.log(`Processing image for tokenURI: ${tokenURI}`);
    const tokenId = extractTokenId(tokenURI);
    const imageKey = `image-${tokenId}.jpg`;

    try {
        await s3.headObject({ Bucket: S3_BUCKET, Key: imageKey }).promise();
        console.log(`Image already exists with key: ${imageKey}`);
        return;
    } catch (error) {
        console.log(`Image does not exist, proceeding to upload. TokenURI: ${tokenURI}`);
    }

    try {
        let response = await fetch(tokenURI);
        if (!response.ok) throw new Error(`Failed to fetch token metadata: ${response.statusText}`);

        const metadata = await response.json();
        const imageUrl = metadata.image;

        if (typeof imageUrl !== 'string') throw new Error('Invalid image URL in metadata');

        response = await fetch(imageUrl);
        if (!response.ok || !response.headers.get('content-type').includes('image')) {
            throw new Error(`URL did not point to an image: ${response.statusText}`);
        }

        const imageBuffer = Buffer.from(await response.arrayBuffer());

        const processedImage = await sharp(imageBuffer)
            .resize(800, 800)
            .toBuffer();

        await s3.upload({
            Bucket: S3_BUCKET,
            Key: imageKey,
            Body: processedImage,
            ContentType: 'image/jpeg',
            ACL: 'public-read'
        }).promise();
        console.log(`Successfully uploaded image with key: ${imageKey}`);
    } catch (error) {
        console.error(`Error processing image from ${tokenURI}:`, error);
    }
}

async function startProcessing() {
    const nfts = await fetchNFTs();
    for (const nft of nfts) {
        await processAndUploadImage(nft.tokenURI);
    }
}

async function continuousProcessing() {
    while (true) {
        await startProcessing();
        await new Promise(resolve => setTimeout(resolve, 1000)); // 60-second delay to reduce API calls
    }
}

continuousProcessing();
