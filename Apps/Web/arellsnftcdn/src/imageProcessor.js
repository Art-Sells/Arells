"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const AWS = __importStar(require("aws-sdk"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const sharp_1 = __importDefault(require("sharp"));
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
function fetchNFTs() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield (0, node_fetch_1.default)(GRAPH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: QUERY })
            });
            // Use the GraphQLResponse interface to assert the type of the JSON response
            const json = yield response.json();
            return json.data.nfts;
        }
        catch (error) {
            console.error('Error fetching NFT data:', error);
            return null;
        }
    });
}
// Function to process and upload each image
function processAndUploadImage(imageUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield (0, node_fetch_1.default)(imageUrl);
            const imageBuffer = yield response.buffer();
            // Process the image with sharp
            const processedImage = yield (0, sharp_1.default)(imageBuffer)
                .resize(800, 800)
                .toBuffer();
            // Generate a unique key for S3 (e.g., using a timestamp)
            const imageKey = `image-${Date.now()}.jpg`;
            // Upload to S3
            yield s3.upload({
                Bucket: S3_BUCKET,
                Key: imageKey,
                Body: processedImage,
                ContentType: 'image/jpeg'
            }).promise();
            console.log(`Uploaded image with key: ${imageKey}`);
        }
        catch (error) {
            console.error(`Error processing image:`, error);
        }
    });
}
// Main function to start the process
function startProcessing() {
    return __awaiter(this, void 0, void 0, function* () {
        const nfts = yield fetchNFTs();
        if (nfts) {
            nfts.forEach(nft => {
                processAndUploadImage(nft.tokenURI);
            });
        }
    });
}
// Call the function to start processing
startProcessing();
