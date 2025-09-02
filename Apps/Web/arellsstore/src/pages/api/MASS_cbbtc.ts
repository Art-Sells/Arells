import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import "dotenv/config";
import { ethers } from "ethers";
import { executeSupplication } from "../../context/LPP/cbbtc/cbbtc_lpp"; 

const BASE_RPC_URL = process.env.BASE_RPC_URL!;
const TRANSFER_FEE_WALLET_PRIVATE_KEY = process.env.ARELLS_PRIVATE_KEY!;

if (!TRANSFER_FEE_WALLET_PRIVATE_KEY || !BASE_RPC_URL) {
  throw new Error("Environment variables not defined properly.");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { cbBitcoinAmount, massAddress, massPrivateKey } = req.body;
  
  if (
    typeof cbBitcoinAmount !== 'number' ||
    cbBitcoinAmount <= 0 ||
    !Number.isFinite(cbBitcoinAmount) ||
    Math.abs(cbBitcoinAmount - parseFloat(cbBitcoinAmount.toFixed(8))) > Number.EPSILON
  ) {
    return res.status(400).json({ error: 'Invalid CBBTC amount. Ensure it is up to 8 decimal points.' });
  }

  if (!cbBitcoinAmount || !massAddress || !massPrivateKey) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    console.log("\n🚀 Starting CBBTC → USDC Supplication...");

    // Step 1: Fund the MASS address with ETH if needed
    const fundingTxHash = await fundGasFees(massAddress);
    console.log(`✅ Gas Fees Funded: ${fundingTxHash}`);

    // Step 2: Execute the Uniswap V3 swap (fee-free route) from CBBTC to USDC
    await executeSupplication(Number(cbBitcoinAmount.toFixed(8)), massPrivateKey,);

    return res.status(200).json({ message: `Supplication executed: ${cbBitcoinAmount} CBBTC → USDC` });
  } catch (error: any) {
    console.error("❌ Error during CBBTC to USDC supplication:", error.message || error);
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
  const balanceInEth = parseFloat(ethers.formatEther(balanceInWei));
  const balanceInUSD = balanceInEth * ethPrice;

  console.log(`🔍 MASS Address Balance: ${balanceInEth.toFixed(8)} ETH (~$${balanceInUSD.toFixed(2)} USD)`);

  const shortfallUSD = TARGET_USD_BALANCE - balanceInUSD;
  if (shortfallUSD <= 0) {
    console.log("✅ MASS Address has sufficient balance. No funding required.");
    return null;
  }

  const amountToFundInEth = shortfallUSD / ethPrice;
  const tx = await wallet.sendTransaction({
    to: recipientAddress,
    value: ethers.parseUnits(amountToFundInEth.toFixed(8), "ether"),
  });

  await tx.wait();
  return tx.hash;
}
