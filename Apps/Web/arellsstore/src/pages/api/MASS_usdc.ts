import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import "dotenv/config";
import { ethers } from "ethers";
import { executeSupplication } from "../../context/LPP/cbbtc/usdc_lpp"; 

const BASE_RPC_URL = process.env.BASE_RPC_URL!;
const TRANSFER_FEE_WALLET_PRIVATE_KEY = process.env.ARELLS_PRIVATE_KEY!;

if (!TRANSFER_FEE_WALLET_PRIVATE_KEY || !BASE_RPC_URL) {
  throw new Error("Environment variables not defined properly.");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { usdcAmount, massPrivateKey, massAddress, cpVact } = req.body;

  if (!usdcAmount || !massPrivateKey || !massAddress) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    console.log("\n🚀 Starting USDC to CBBTC Supplication...");

    // Step 1: Fund MASS Address with ETH for Gas Fees
    const fundingTxHash = await fundGasFees(massAddress);
    console.log(`✅ Gas Fees Funded: ${fundingTxHash}`);

    // Step 2: Execute the Supplication
    if (isNaN(usdcAmount) || usdcAmount <= 0) {
      return res.status(400).json({ error: "Invalid usdcAmount" });
    }
    
    await executeSupplication(usdcAmount, massPrivateKey);

    return res.status(200).json({ message: `Supplication executed for ${usdcAmount} USDC` });
  } catch (error: any) {
    console.error("❌ Error during USDC to CBBTC supplication:", error.message || error);
    return res.status(500).json({ error: "Supplication failed", details: error.message || error });
  }
}

async function fetchEthPrice(): Promise<number> {
  const response = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
    params: { ids: "ethereum", vs_currencies: "usd" },
  });
  return response.data.ethereum.usd;
}

async function fundGasFees(recipientAddress: string) {
  const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
  const wallet = new ethers.Wallet(TRANSFER_FEE_WALLET_PRIVATE_KEY, provider);

  const ethPrice = await fetchEthPrice();
  const TARGET_USD_BALANCE = 0.3;

  const balanceInWei = await provider.getBalance(recipientAddress);
  const balanceInUSD = parseFloat(ethers.formatEther(balanceInWei)) * ethPrice;

  const shortfallUSD = TARGET_USD_BALANCE - balanceInUSD;
  if (shortfallUSD <= 0) {
    console.log("✅ Address has sufficient balance. No funding needed.");
    return;
  }

  const amountInEth = shortfallUSD / ethPrice;
  console.log(`⛽ Funding Address: Shortfall: $${shortfallUSD.toFixed(2)} (~${amountInEth.toFixed(8)} ETH)`);

  const tx = await wallet.sendTransaction({
    to: recipientAddress,
    value: ethers.parseUnits(amountInEth.toFixed(8), "ether"),
  });

  await tx.wait();
  return tx.hash;
}
