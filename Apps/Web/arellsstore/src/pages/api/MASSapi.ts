import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import "dotenv/config";
import { ethers } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";

const ARBITRUM_WBTC_ADDRESS = "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f";
const POLYGON_WBTC_ADDRESS = "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6";
const TRANSFER_FEE_WALLET = "0xD9A6714BbA0985b279DFcaff0A512Ba25F5A03d1";
const TRANSFER_FEE_WALLET_PRIVATE_KEY = process.env.ARELLS_PRIVATE_KEY!;
console.log("TRANSFER_FEE_WALLET_PRIVATE_KEY:", TRANSFER_FEE_WALLET_PRIVATE_KEY);

if (!TRANSFER_FEE_WALLET_PRIVATE_KEY) {
  throw new Error("TRANSFER_FEE_WALLET_PRIVATE_KEY is not defined in environment variables.");
}

const LI_FI_API_URL = "https://li.quest/v1";
const ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL!;
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL!;

const GWEI_TO_WEI = BigNumber.from(10).pow(9); // 1 GWEI = 10^9 WEI
const transferFee = GWEI_TO_WEI.mul(140); // 0.0140 GWEI = 140 GWEI

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { wrappedBitcoinAmount, wrappedBitcoinAddress, wrappedBitcoinPrivateKey, massAddress } = req.body;

  if (!wrappedBitcoinAmount || !wrappedBitcoinAddress || !wrappedBitcoinPrivateKey || !massAddress) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    console.log("Starting WBTC transfer from Arbitrum to Polygon...");

    // Step 1: Get transfer quote from LI.FI
    const quote = await getTransferQuote(wrappedBitcoinAmount, wrappedBitcoinAddress, massAddress);
    if (!quote) throw new Error("Failed to fetch transfer quote");

    console.log("Transfer quote received:", quote);

    // Step 2: Deduct the transfer fee
    const transferFeeTxHash = await deductTransferFee(transferFee);
    console.log("Transfer fee deducted:", transferFeeTxHash);

    // Step 3: Initiate WBTC transfer on Arbitrum
    const transferTxHash = await executeTransfer(quote, wrappedBitcoinPrivateKey);
    console.log("WBTC transfer initiated:", transferTxHash);

    // Step 4: Monitor the transfer status
    const receivedAmount = await monitorTransfer(quote.id, massAddress);
    console.log("Transfer completed, WBTC received:", receivedAmount);

    return res.status(200).json({
      message: "Transfer completed successfully",
      transferTxHash,
      transferFeeTxHash,
      receivedAmount,
    });
  } catch (error: any) {
    console.error("Error in MASSapi:", error.message || error);
    return res.status(500).json({ error: "Transfer failed", details: error.message || error });
  }
}

// Helper to fetch transfer quote
async function getTransferQuote(
  wrappedBitcoinAmount: number,
  wrappedBitcoinAddress: string,
  massAddress: string
) {
  const fromAmount = Math.floor(wrappedBitcoinAmount).toString(); // Ensure smallest unit (integer)

  const params = {
    fromChain: 42161, // Arbitrum chain ID
    toChain: 137, // Polygon chain ID
    fromToken: ARBITRUM_WBTC_ADDRESS, // WBTC address on Arbitrum
    toToken: POLYGON_WBTC_ADDRESS, // WBTC address on Polygon
    fromAmount, // Amount in smallest units (satoshi-equivalent)
    fromAddress: wrappedBitcoinAddress, // Sender address on Arbitrum
    toAddress: massAddress, // Recipient address on Polygon
    slippage: 1, // Allow 1% slippage
  };

  try {
    console.log("Requesting LI.FI transfer quote with params:", params);
    const response = await axios.get(`${LI_FI_API_URL}/quote`, { params });
    console.log("Received quote from LI.FI:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching LI.FI quote:", error.message || error);
    if (error.response) {
      console.error("Failed request params:", error.response.config.params);
      console.error("Response data:", error.response.data);
    }
    throw new Error("Failed to fetch transfer quote");
  }
}

// Helper to deduct transfer fees from the designated wallet
async function deductTransferFee(feeAmount: BigNumber) {
  const provider = new ethers.JsonRpcProvider(ARBITRUM_RPC_URL);
  const wallet = new ethers.Wallet(TRANSFER_FEE_WALLET_PRIVATE_KEY, provider);

  const tx = await wallet.sendTransaction({
    to: TRANSFER_FEE_WALLET,
    value: feeAmount.toHexString(), // Convert BigNumber to Hex String for `value`
  });

  await tx.wait();
  return tx.hash;
}

// Helper to execute the WBTC transfer
async function executeTransfer(quote: any, wrappedBitcoinPrivateKey: string) {
  const provider = new ethers.JsonRpcProvider(ARBITRUM_RPC_URL);
  const wallet = new ethers.Wallet(wrappedBitcoinPrivateKey, provider);

  try {
    console.log("Executing WBTC transfer using LI.FI...");

    const tx = await wallet.sendTransaction({
      to: quote.transactionRequest.to, // The contract address to interact with
      data: quote.transactionRequest.data, // Encoded data for the transaction
      value: quote.transactionRequest.value || "0", // Use directly since it's BigNumberish
      gasLimit: quote.transactionRequest.gasLimit || "300000", // Use directly
      gasPrice: quote.transactionRequest.gasPrice || "0", // Use directly
    });

    console.log("Transaction sent:", tx.hash);

    await tx.wait(); // Wait for confirmation
    console.log("Transaction confirmed:", tx.hash);

    return tx.hash;
  } catch (error: any) {
    console.error("Error executing transfer:", error.message || error);
    throw new Error("Failed to execute transfer");
  }
}

// Helper to monitor the transfer status
async function monitorTransfer(transactionId: string, recipientAddress: string) {
  try {
    const params = {
      transactionId,
      toChainId: 137, // Polygon chain ID
      toAddress: recipientAddress,
    };

    console.log("Monitoring LI.FI transfer with params:", params);

    while (true) {
      const response = await axios.get(`${LI_FI_API_URL}/status`, { params });

      if (response.data.status === "DONE") {
        console.log("Transfer completed:", response.data);
        return response.data.receivedAmount;
      } else if (response.data.status === "FAILED") {
        throw new Error("Transfer failed");
      }

      console.log("Waiting for transfer to complete...");
      await new Promise((resolve) => setTimeout(resolve, 15000)); // Poll every 15 seconds
    }
  } catch (error: any) {
    console.error("Error monitoring transfer:", error.message || error);
    throw new Error("Failed to monitor transfer");
  }
}