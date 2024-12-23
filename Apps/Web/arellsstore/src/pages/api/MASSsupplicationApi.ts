import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import "dotenv/config";
import { ethers } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";

// Constants
const BASE_BTC_ADDRESS = "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf";
const BASE_USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const BASE_RPC_URL = process.env.BASE_RPC_URL!;
const TRANSFER_FEE_WALLET_PRIVATE_KEY = process.env.ARELLS_PRIVATE_KEY!;
const LI_FI_API_URL = "https://li.quest/v1";

// Ensure ENV variables are set
if (!TRANSFER_FEE_WALLET_PRIVATE_KEY || !BASE_RPC_URL) {
  throw new Error("Environment variables not defined properly.");
}

// **Main API Handler**
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { usdcAmount, massSupplicationAddress, massSupplicationPrivateKey, massAddress } = req.body;

  if (!usdcAmount || !massSupplicationAddress || !massSupplicationPrivateKey || !massAddress) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    console.log("🚀 Starting USDC to WBTC Supplication...");

    // Step 1: Fetch Transfer Quote
    const quote = await fetchTransferQuote(usdcAmount, massSupplicationAddress, massAddress);
    console.log("✅ Transfer Quote Received:", quote);

    // Step 2: Fund MASS Supplication Address with ETH for Gas Fees
    const fundingTxHash = await fundGasFees(massSupplicationAddress);
    console.log(`✅ Gas Fees Funded: ${fundingTxHash}`);

    // Step 3: Check and Set Allowance for USDC
    await checkAndSetAllowance(
      massSupplicationPrivateKey,
      BASE_USDC_ADDRESS,
      quote.estimate.approvalAddress,
      usdcAmount
    );

    // Step 4: Execute USDC Transfer
    const transferTxHash = await executeTransfer(quote, massSupplicationPrivateKey);
    console.log(`✅ USDC Transfer Initiated: ${transferTxHash}`);

    // Step 5: Monitor Transfer Status
    const receivedAmount = await monitorTransfer(transferTxHash);
    console.log(`✅ Transfer Completed. Received Amount: ${receivedAmount}`);

    res.status(200).json({
      message: "Transfer completed successfully",
      transferTxHash,
      fundingTxHash,
      receivedAmount,
    });
  } catch (error: any) {
    console.error("❌ Error during USDC to WBTC transfer:", error.message || error);
    res.status(500).json({ error: "Transfer failed", details: error.message || error });
  }
}

/* Helper Functions */

// Fetch ETH price
async function fetchEthPrice(): Promise<number> {
  const response = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
    params: { ids: "ethereum", vs_currencies: "usd" },
  });
  return response.data.ethereum.usd;
}

// Fund gas fees
async function fundGasFees(recipientAddress: string) {
  const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
  const wallet = new ethers.Wallet(TRANSFER_FEE_WALLET_PRIVATE_KEY, provider);

  const ethPrice = await fetchEthPrice();
  const TARGET_USD_BALANCE = 0.30;

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

// Fetch Transfer Quote
async function fetchTransferQuote(amount: number, fromAddress: string, toAddress: string) {
  const params = {
    fromChain: 8453,
    toChain: 8453,
    fromToken: BASE_USDC_ADDRESS,
    toToken: BASE_BTC_ADDRESS,
    fromAmount: Math.floor(amount).toString(),
    fromAddress,
    toAddress,
    slippage: 1,
  };
  const response = await axios.get(`${LI_FI_API_URL}/quote`, { params });
  return response.data;
}

// Check and Set Allowance
async function checkAndSetAllowance(
  privateKey: string,
  tokenAddress: string,
  spenderAddress: string,
  amount: number
) {
  const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);

  const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
  ];
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

  const currentAllowance = await tokenContract.allowance(await wallet.getAddress(), spenderAddress);
  const bigAmount = BigNumber.from(Math.floor(amount).toString());

  if (BigNumber.from(currentAllowance).lt(bigAmount)) {
    const tx = await tokenContract.approve(spenderAddress, bigAmount.toString());
    await tx.wait();
    console.log(`✅ Approval successful: ${tx.hash}`);
  } else {
    console.log("✅ Sufficient allowance already exists.");
  }
}

// Execute Transfer Transaction
async function executeTransfer(quote: any, privateKey: string) {
  const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);

  const txRequest = {
    to: quote.transactionRequest.to,
    data: quote.transactionRequest.data,
    value: quote.transactionRequest.value || "0",
    gasLimit: quote.transactionRequest.gasLimit || "300000",
  };

  console.log("🚀 Sending transaction...");
  const tx = await wallet.sendTransaction(txRequest);
  console.log(`✅ Transaction sent. Hash: ${tx.hash}`);

  await tx.wait();
  return tx.hash;
}

function isValidTxHash(txHash: string): boolean {
  return /^0x([A-Fa-f0-9]{64})$/.test(txHash);
}

async function monitorTransfer(txHash: string) {
  if (!isValidTxHash(txHash)) {
    throw new Error(`/txHash Not a valid txHash: ${txHash}`);
  }

  const params = { txHash };

  console.log("🔍 Monitoring Transfer Status...");

  while (true) {
    try {
      const response = await axios.get(`${LI_FI_API_URL}/status`, { params });
      const { status, substatus, substatusMessage, lifiExplorerLink, receiving } = response.data;

      console.log(`🔍 Current Status: ${status}, Sub-status: ${substatus || "N/A"}`);
      
      if (status === "DONE") {
        console.log("✅ Transfer Completed:", response.data);
        console.log(`🔗 View on LiFi Explorer: ${lifiExplorerLink}`);
        return receiving?.amount || "Unknown Amount";
      }

      if (status === "FAILED") {
        throw new Error(`Transfer failed: ${substatusMessage || "No details available"}`);
      }

      console.log("⏳ Waiting for transfer to complete...");
      await new Promise((resolve) => setTimeout(resolve, 15000));
    } catch (error: any) {
      console.error("❌ Error while checking transfer status:", error.response?.data || error.message);
      throw new Error("Failed to monitor transfer.");
    }
  }
}