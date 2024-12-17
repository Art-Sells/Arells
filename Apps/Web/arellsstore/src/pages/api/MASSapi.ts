import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import "dotenv/config";
import { ethers } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";

// Constants
const ARBITRUM_WBTC_ADDRESS = "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f";
const ARBITRUM_USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL!;
const TRANSFER_FEE_WALLET_PRIVATE_KEY = process.env.ARELLS_PRIVATE_KEY!;
const LI_FI_API_URL = "https://li.quest/v1";

// Ensure ENV variables are set
if (!TRANSFER_FEE_WALLET_PRIVATE_KEY || !ARBITRUM_RPC_URL) {
  throw new Error("Environment variables not defined properly.");
}

// **Main API Handler**
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { wrappedBitcoinAmount, massAddress, massPrivateKey, massSupplicationAddress } = req.body;

  if (!wrappedBitcoinAmount || !massAddress || !massPrivateKey || !massSupplicationAddress) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    console.log("🚀 Starting WBTC to USDC Supplication...");

    // Step 1: Fetch Transfer Quote
    const quote = await fetchTransferQuote(wrappedBitcoinAmount, massAddress, massSupplicationAddress);
    console.log("✅ Transfer Quote Received:", quote);

    // Step 2: Fund MASS Address with $0.11 Worth of ETH
    const fundingTxHash = await fundGasFees(massAddress);
    console.log(`✅ Gas Fees Funded: ${fundingTxHash}`);

    // Step 3: Check and Set Allowance for WBTC
    await checkAndSetAllowance(massPrivateKey, ARBITRUM_WBTC_ADDRESS, quote.estimate.approvalAddress, wrappedBitcoinAmount);

    // Step 4: Execute WBTC Transfer
    const transferTxHash = await executeTransfer(quote, massPrivateKey);
    console.log(`✅ WBTC Transfer Initiated: ${transferTxHash}`);

    // Step 5: Monitor Transfer Status
    const receivedAmount = await monitorTransfer(quote.id);
    console.log(`✅ Transfer Completed. Received Amount: ${receivedAmount}`);

    res.status(200).json({
      message: "Transfer completed successfully",
      transferTxHash,
      fundingTxHash,
      receivedAmount,
    });
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
  const provider = new ethers.JsonRpcProvider(ARBITRUM_RPC_URL);
  const wallet = new ethers.Wallet(TRANSFER_FEE_WALLET_PRIVATE_KEY, provider);

  // Fetch ETH price
  const ethPrice = await fetchEthPrice();

  // Define target funding amount in USD ($0.30)
  const TARGET_USD_BALANCE = 0.31;

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
    fromChain: 42161,
    toChain: 42161,
    fromToken: ARBITRUM_WBTC_ADDRESS,
    toToken: ARBITRUM_USDC_ADDRESS,
    fromAmount: Math.floor(amount).toString(), // Truncate decimals
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
  const provider = new ethers.JsonRpcProvider(ARBITRUM_RPC_URL);
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
  const provider = new ethers.JsonRpcProvider(ARBITRUM_RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);

  const txRequest = {
    to: quote.transactionRequest.to,
    data: quote.transactionRequest.data,
    value: quote.transactionRequest.value || "0",
    gasLimit: quote.transactionRequest.gasLimit || "300000",
  };

  const tx = await wallet.sendTransaction(txRequest);
  await tx.wait();
  return tx.hash;
}

/* Monitor Transfer Status */
/* Monitor Transfer Status */
async function monitorTransfer(txHash: string) {
  const params = { txHash }; // txHash is the key parameter now.

  console.log("🔍 Monitoring Transfer Status...");

  while (true) {
    try {
      const response = await axios.get(`${LI_FI_API_URL}/status`, { params });
      const { status, substatus, substatusMessage, lifiExplorerLink, receiving } = response.data;

      console.log(`🔍 Current Status: ${status}, Sub-status: ${substatus || "N/A"}`);
      
      // If status is "DONE", log the success and return the amount received.
      if (status === "DONE") {
        console.log("✅ Transfer Completed:", response.data);
        console.log(`🔗 View on LiFi Explorer: ${lifiExplorerLink}`);
        return receiving?.amount || "Unknown Amount";
      }

      // If status is "FAILED", throw an error with additional details
      if (status === "FAILED") {
        console.error(`❌ Transfer Failed: ${substatusMessage || "Unknown error"}`);
        throw new Error(`Transfer failed: ${substatusMessage || "No details available"}`);
      }

      // Handle substatuses for "PENDING" or unexpected errors
      if (status === "PENDING") {
        switch (substatus) {
          case "WAIT_SOURCE_CONFIRMATIONS":
            console.log("⏳ Waiting for source confirmations...");
            break;
          case "WAIT_DESTINATION_TRANSACTION":
            console.log("⏳ Destination transaction pending, waiting for mining...");
            break;
          case "BRIDGE_NOT_AVAILABLE":
            console.warn("⚠️ Bridge API temporarily unavailable. Retrying...");
            break;
          case "CHAIN_NOT_AVAILABLE":
            console.warn("⚠️ RPC communication issue on source/destination chain. Retrying...");
            break;
          case "REFUND_IN_PROGRESS":
            console.warn("⏳ Refund is being processed. Please wait...");
            break;
          case "UNKNOWN_ERROR":
            console.error("⚠️ An unknown error occurred. Retrying...");
            break;
          default:
            console.log(`⏳ Transfer pending... Sub-status: ${substatus || "N/A"}`);
        }
      }

      // Handle "NOT_FOUND" status
      if (status === "NOT_FOUND") {
        console.warn("⚠️ Transaction not found. It might still be pending mining...");
      }

      // Wait before retrying the status check
      console.log("⏳ Waiting 15 seconds before checking again...");
      await new Promise((resolve) => setTimeout(resolve, 15000));

    } catch (error: any) {
      console.error("❌ Error while checking transfer status:", error.response?.data || error.message);
      throw new Error("Failed to monitor transfer.");
    }
  }
}