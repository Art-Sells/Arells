import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import * as bitcoin from "bitcoinjs-lib";
import { loadTinySecp256k1 } from "../../lib/bitcoin"; // Adjust path to your bitcoin.ts
import { createTransaction } from "../../lib/bitcoin"; // Adjust path to your bitcoin.ts

const BTC_NETWORK = bitcoin.networks.bitcoin; // Mainnet for Bitcoin
const LI_FI_API_URL = "https://li.quest/v1";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { bitcoinAmount, bitcoinAddress, bitcoinPrivateKey, massAddress } = req.body;

  if (!bitcoinAmount || !bitcoinAddress || !bitcoinPrivateKey || !massAddress) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const tinySecp256k1 = await loadTinySecp256k1();
    const ECPairFactory = (await import("ecpair")).default;
    const ECPair = ECPairFactory(tinySecp256k1);

    // Step 1: Get Quote for BTC -> WBTC Conversion
    const quote = await getConvertQuote(bitcoinAmount, massAddress);

    if (!quote) {
      throw new Error("Failed to fetch conversion quote");
    }

    console.log("LI.FI Conversion Quote:", quote);

    // Step 2: Perform Bitcoin Transaction
    const btcKeyPair = ECPair.fromWIF(bitcoinPrivateKey, BTC_NETWORK);
    const senderAddress = bitcoin.payments.p2pkh({
      pubkey: Buffer.from(btcKeyPair.publicKey), // Convert publicKey to Buffer
    }).address!;
    const { txHex, txId } = await createTransaction(
      bitcoinPrivateKey,
      quote.depositAddress,
      bitcoinAmount,
      10000 // Estimated fee in satoshis
    );

    console.log("Bitcoin Transaction Hex:", txHex);
    console.log("Bitcoin Transaction ID:", txId);

    // Step 3: Monitor and Confirm Conversion
    const wbtcAmount = await monitorConversion(quote.transactionId, massAddress);

    return res.status(200).json({
      message: "Conversion completed successfully",
      txId,
      wbtcAmount,
    });
  } catch (error) {
    console.error("Error in convertBitcoinToWBTC:", error instanceof Error ? error.message : error);
    res.status(500).json({ error: "Conversion failed", details: error });
  }
}

// Get LI.FI Conversion Quote
async function getConvertQuote(bitcoinAmount: number, recipientAddress: string) {
  try {
    const response = await axios.get(`${LI_FI_API_URL}/quote`, {
      params: {
        fromChainId: 1, // Bitcoin Mainnet
        toChainId: 137, // Polygon Mainnet
        fromTokenAddress: "BTC", // LI.FI token identifier for BTC
        toTokenAddress: "WBTC", // LI.FI token identifier for WBTC on Polygon
        fromAmount: bitcoinAmount.toString(), // Amount in satoshis
        toAddress: recipientAddress, // Destination WBTC address on Polygon
        slippage: 1, // Allow 1% slippage
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching LI.FI quote:", error instanceof Error ? error.message : error);
    return null;
  }
}

// Monitor LI.FI Conversion
async function monitorConversion(transactionId: string, recipientAddress: string) {
  try {
    while (true) {
      const statusResponse = await axios.get(`${LI_FI_API_URL}/status`, {
        params: { transactionId },
      });

      if (statusResponse.data.status === "COMPLETED") {
        console.log("Conversion completed:", statusResponse.data);
        return parseFloat(statusResponse.data.receivedAmount);
      } else if (statusResponse.data.status === "FAILED") {
        throw new Error("Conversion failed");
      }

      console.log("Waiting for conversion to complete...");
      await new Promise((resolve) => setTimeout(resolve, 15000)); // Poll every 15 seconds
    }
  } catch (error) {
    console.error("Error monitoring conversion:", error instanceof Error ? error.message : error);
    throw new Error("Failed to monitor conversion");
  }
}