import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import * as bitcoin from "bitcoinjs-lib";
import { loadTinySecp256k1, createTransaction } from "../../lib/bitcoin";

const BTC_NETWORK = bitcoin.networks.bitcoin;
const WBTC_ON_POL = 0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { bitcoinAmount, bitcoinAddress, bitcoinPrivateKey, massAddress } = req.body;

  if (!bitcoinAmount || !bitcoinAddress || !bitcoinPrivateKey || !massAddress) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    console.log("Starting BTC to WBTC conversion...");

    // Step 1: Get conversion quote
    const quote = await getConvertQuote(bitcoinAmount, bitcoinAddress, massAddress);
    if (!quote) throw new Error("Failed to fetch conversion quote");

    console.log("Conversion quote received:", quote);

    // Step 2: Create BTC transaction
    const { txHex, txId } = await createTransaction(
      bitcoinPrivateKey,
      quote.transactionRequest.to, // Destination address from the quote
      bitcoinAmount,
      10000 // Fee in satoshis
    );

    console.log("Transaction created:", { txHex, txId });

    // Step 3: Monitor conversion
    const wbtcAmount = await monitorConversion(quote.tool, txId);

    return res.status(200).json({
      message: "Conversion completed successfully",
      txId,
      wbtcAmount,
    });
  } catch (error: any) {
    console.error("Error in convertBitcoinToWBTC:", error.message || error);
    return res.status(500).json({ error: "Conversion failed", details: error.message || error });
  }
}

// Helper to fetch conversion quote
async function getConvertQuote(
  bitcoinAmount: number,
  fromAddress: string,
  toAddress: string
) {
  const params = {
    fromChain: 20000000000001, // Bitcoin chain ID
    toChain: 'POL', // Polygon chain ID
    fromToken: "bitcoin", // Native BTC token identifier
    toToken: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", //  WBTC token address on Polygon
    fromAmount: bitcoinAmount.toString(), // Amount in satoshis
    fromAddress, // Bitcoin sender address
    toAddress, // Polygon WBTC recipient address
    slippage: 1, // 1% slippage
  };

  try {
    console.log("Requesting LI.FI quote with params:", params);

    const response = await axios.get("https://li.quest/v1/quote", { params });

    console.log("Received quote from LI.FI:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching LI.FI quote:", error.message || error);
    if (error.response) {
      console.error("Failed request params:", error.response.config.params);
      console.error("Response data:", error.response.data);
    }
    throw new Error("Failed to fetch conversion quote");
  }
}

// Helper to monitor conversion status
async function monitorConversion(tool: string, txHash: string) {
  try {
    const params = {
      bridge: tool,
      fromChain: "BTC",
      toChain: "POL",
      txHash,
    };

    console.log("Monitoring LI.FI conversion with params:", params);

    while (true) {
      const response = await axios.get("https://li.quest/v1/status", { params });

      if (response.data.status === "DONE") {
        console.log("Conversion completed:", response.data);
        return response.data.receivedAmount;
      } else if (response.data.status === "FAILED") {
        throw new Error("Conversion failed");
      }

      console.log("Waiting for conversion to complete...");
      await new Promise((resolve) => setTimeout(resolve, 15000)); // Poll every 15 seconds
    }
  } catch (error: any) {
    console.error("Error monitoring conversion:", error.message || error);
    throw new Error("Failed to monitor conversion");
  }
}