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

  const { wrappedBitcoinAmount, massAddress, massPrivateKey } = req.body;

  if (
    typeof wrappedBitcoinAmount !== 'number' ||
    wrappedBitcoinAmount <= 0 ||
    !Number.isFinite(wrappedBitcoinAmount) ||
    Math.abs(wrappedBitcoinAmount - parseFloat(wrappedBitcoinAmount.toFixed(8))) > Number.EPSILON // Ensure up to 8 decimals
  ) {
    return res.status(400).json({ error: 'Invalid WBTC amount. Ensure it is up to 8 decimal points.' });
  }

  if (!wrappedBitcoinAmount || !massAddress || !massPrivateKey) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    console.log("🚀 Starting WBTC to USDC Supplication...");

    // Step 1: Fetch Transfer Quote
    const quote = await fetchTransferQuote(wrappedBitcoinAmount, massAddress, massAddress);
    console.log("✅ Transfer Quote Received:", quote);

    // Step 2: Fund MASS Address with ETH for Gas Fees
    const fundingTxHash = await fundGasFees(massAddress);
    console.log(`✅ Gas Fees Funded: ${fundingTxHash}`);

    // Step 3: Check and Set Allowance for WBTC
    await checkAndSetAllowance(massPrivateKey, BASE_BTC_ADDRESS, quote.estimate.approvalAddress, wrappedBitcoinAmount);

    // Step 4: Execute WBTC Transfer
    const transferTxHash = await executeTransfer(quote, massPrivateKey);
    console.log(`✅ WBTC Transfer Initiated: ${transferTxHash}`);

    // Step 5: Confirm Transfer Completion
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    const receipt = await provider.getTransactionReceipt(transferTxHash);

    console.log("✅ Transfer Confirmed on-chain:", receipt);
  } catch (error: any) {
    console.error("❌ Error during WBTC to USDC transfer:", error.message || error);
    res.status(500).json({ error: "Transfer failed", details: error.message || error });
  }
}

// **Helper Functions**

/* Fetch Current ETH Price */
async function fetchEthPrice(): Promise<number> {
  const response = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
    params: { ids: "ethereum", vs_currencies: "usd" },
  });
  return response.data.ethereum.usd;
}

/* Fund MASS Address with ETH for Gas Fees */
/* Fund MASS Address with ETH for Gas Fees */
async function fundGasFees(recipientAddress: string) {
  const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
  const wallet = new ethers.Wallet(TRANSFER_FEE_WALLET_PRIVATE_KEY, provider);

  // Fetch ETH price
  const ethPrice = await fetchEthPrice();

  // Define target funding amount in USD ($0.30)
  const TARGET_USD_BALANCE = 0.50;

  // Check current balance of MASS address
  const balanceInWei = await provider.getBalance(recipientAddress);
  const balanceInEth = parseFloat(ethers.formatEther(balanceInWei));
  const balanceInUSD = balanceInEth * ethPrice;

  console.log(
    `🔍 MASS Address Balance: ${balanceInEth.toFixed(8)} ETH (~$${balanceInUSD.toFixed(2)} USD)`
  );

  // Calculate the funding amount required
  const shortfallUSD = TARGET_USD_BALANCE - balanceInUSD;

  if (shortfallUSD <= 0) {
    console.log("✅ MASS Address has sufficient balance. No funding required.");
    return;
  }

  const amountToFundInEth = shortfallUSD / ethPrice;

  console.log(
    `⛽ Funding MASS Address: Shortfall: $${shortfallUSD.toFixed(2)} (~${amountToFundInEth.toFixed(8)} ETH)`
  );

  // Send the calculated amount
  const tx = await wallet.sendTransaction({
    to: recipientAddress,
    value: ethers.parseUnits(amountToFundInEth.toFixed(8), "ether"),
  });

  await tx.wait();
  console.log(`✅ Gas Fees Funded: ${tx.hash}`);
  return tx.hash;
}

async function fetchTransferQuote(amount: number, fromAddress: string, toAddress: string) {
  const params = {
    fromChain: 8453,
    toChain: 8453,
    fromToken: BASE_BTC_ADDRESS,
    toToken: BASE_USDC_ADDRESS,
    fromAmount: amount.toString(), // Truncate decimals
    fromAddress,
    toAddress,
    slippage: 1,
  };

  const response = await axios.get(`${LI_FI_API_URL}/quote`, { params });
  return response.data;
}

/* Check and Set Allowance for WBTC */
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

  console.log(`🔍 Checking allowance for ${spenderAddress} to spend WBTC...`);
  const currentAllowance = await tokenContract.allowance(await wallet.getAddress(), spenderAddress);

  const bigAmount = BigNumber.from(Math.floor(amount).toString()); // Ensure integer value

  if (BigNumber.from(currentAllowance).lt(bigAmount)) {
    console.log("⛽ Insufficient allowance, approving token...");
    const tx = await tokenContract.approve(spenderAddress, bigAmount.toString()); // Convert to string here
    await tx.wait();
    console.log(`✅ Approval successful: ${tx.hash}`);
  } else {
    console.log("✅ Sufficient allowance already exists.");
  }
}

/* Execute Transfer Transaction */
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