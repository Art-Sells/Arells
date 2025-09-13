// POST /api/fundMassGas
// body: { recipientAddress: string; targetUsd?: number }

import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { ethers } from "ethers";

const BASE_RPC_URL = process.env.BASE_RPC_URL!;
const TRANSFER_FEE_WALLET_PRIVATE_KEY = process.env.ARELLS_PRIVATE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { recipientAddress, targetUsd } = req.body as { recipientAddress?: string; targetUsd?: number };
  if (!recipientAddress) return res.status(400).json({ error: "recipientAddress is required" });
  if (!BASE_RPC_URL || !TRANSFER_FEE_WALLET_PRIVATE_KEY) {
    return res.status(500).json({ error: "Server not configured" });
  }

  try {
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    const wallet = new ethers.Wallet(TRANSFER_FEE_WALLET_PRIVATE_KEY, provider);

    const ethUsd = await fetchEthPrice();
    const TARGET_USD_BALANCE = typeof targetUsd === "number" && targetUsd > 0 ? targetUsd : 0.05; // $0.05 default

    const balWei = await provider.getBalance(recipientAddress);
    const balUsd = parseFloat(ethers.formatEther(balWei)) * ethUsd;

    const shortfallUsd = TARGET_USD_BALANCE - balUsd;
    if (shortfallUsd <= 0) {
      return res.status(200).json({ message: "No funding needed", funded: false, balanceUsd: balUsd });
    }

    const amountEth = shortfallUsd / ethUsd;
    const tx = await wallet.sendTransaction({
      to: recipientAddress,
      value: ethers.parseUnits(amountEth.toFixed(8), "ether"),
    });
    await tx.wait();

    return res.status(200).json({ message: "Funded", funded: true, txHash: tx.hash, targetUsd: TARGET_USD_BALANCE });
  } catch (e: any) {
    console.error("fundMassGas error:", e?.message || e);
    return res.status(500).json({ error: "Funding failed", details: e?.message || e });
  }
}

async function fetchEthPrice(): Promise<number> {
  const r = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
    params: { ids: "ethereum", vs_currencies: "usd" },
  });
  return r.data.ethereum.usd;
}