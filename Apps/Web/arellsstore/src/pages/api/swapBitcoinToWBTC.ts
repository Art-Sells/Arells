import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { ethers } from 'ethers';
import bitcoin from 'bitcoinjs-lib';

const BTC_NETWORK = bitcoin.networks.bitcoin; // Mainnet for Bitcoin
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL!;
const LI_FI_API_URL = 'https://li.quest/v1';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { bitcoinAmount, bitcoinAddress, bitcoinPrivateKey, massAddress, massPrivateKey } = req.body;

  if (!bitcoinAmount || !bitcoinAddress || !bitcoinPrivateKey || !massAddress || !massPrivateKey) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Step 1: Get Quote for BTC -> WBTC Swap
    const quote = await getSwapQuote(bitcoinAmount, massAddress);

    if (!quote) {
      throw new Error('Failed to fetch swap quote');
    }

    console.log('LI.FI Swap Quote:', quote);

    // Step 2: Perform Bitcoin Transaction
    const btcKeyPair = bitcoin.ECPair.fromWIF(bitcoinPrivateKey, BTC_NETWORK);
    const { txHex, targetAddress } = await createBTCTransaction(btcKeyPair, bitcoinAmount, quote.depositAddress);

    const btcTxId = await broadcastBTCTransaction(txHex);

    console.log('Bitcoin Transaction ID:', btcTxId);

    // Step 3: Monitor and Confirm Swap
    const wbtcAmount = await monitorSwap(quote.transactionId, massAddress);

    return res.status(200).json({
      message: 'Swap completed successfully',
      btcTxId,
      wbtcAmount,
    });
  } catch (error) {
    console.error('Error in swapBitcoinToWBTC:', error);
    res.status(500).json({ error: 'Swap failed', details: error.message });
  }
}

// Get LI.FI Swap Quote
async function getSwapQuote(bitcoinAmount: number, recipientAddress: string) {
  try {
    const response = await axios.get(`${LI_FI_API_URL}/quote`, {
      params: {
        fromChainId: 1, // Bitcoin Mainnet
        toChainId: 137, // Polygon Mainnet
        fromTokenAddress: 'BTC', // LI.FI token identifier for BTC
        toTokenAddress: 'WBTC', // LI.FI token identifier for WBTC on Polygon
        fromAmount: bitcoinAmount.toString(), // Amount in satoshis
        toAddress: recipientAddress, // Destination WBTC address on Polygon
        slippage: 1, // Allow 1% slippage
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching LI.FI quote:', error);
    return null;
  }
}

// Create Bitcoin Transaction
async function createBTCTransaction(
  keyPair: bitcoin.ECPairInterface,
  amount: number,
  depositAddress: string
): Promise<{ txHex: string; targetAddress: string }> {
  const psbt = new bitcoin.Psbt({ network: BTC_NETWORK });

  const utxos = await getBTCUTXOs(keyPair.publicKey.toString('hex'));
  const totalSatoshis = utxos.reduce((sum: number, utxo: any) => sum + utxo.value, 0);

  if (totalSatoshis < amount) {
    throw new Error('Insufficient BTC balance');
  }

  utxos.forEach((utxo: any) => {
    psbt.addInput({ hash: utxo.txid, index: utxo.vout });
  });

  psbt.addOutput({
    address: depositAddress,
    value: amount,
  });

  utxos.forEach((_, index: number) => {
    psbt.signInput(index, keyPair);
  });

  psbt.finalizeAllInputs();

  return { txHex: psbt.extractTransaction().toHex(), targetAddress: depositAddress };
}

// Broadcast Bitcoin Transaction
async function broadcastBTCTransaction(txHex: string) {
  try {
    const response = await axios.post('https://blockstream.info/api/tx', txHex);
    return response.data; // Transaction ID
  } catch (error) {
    console.error('Error broadcasting BTC transaction:', error);
    throw new Error('Failed to broadcast BTC transaction');
  }
}

// Monitor LI.FI Swap
async function monitorSwap(transactionId: string, recipientAddress: string) {
  try {
    while (true) {
      const statusResponse = await axios.get(`${LI_FI_API_URL}/status`, {
        params: { transactionId },
      });

      if (statusResponse.data.status === 'COMPLETED') {
        console.log('Swap completed:', statusResponse.data);
        return parseFloat(statusResponse.data.receivedAmount);
      } else if (statusResponse.data.status === 'FAILED') {
        throw new Error('Swap failed');
      }

      console.log('Waiting for swap to complete...');
      await new Promise((resolve) => setTimeout(resolve, 15000)); // Poll every 15 seconds
    }
  } catch (error) {
    console.error('Error monitoring swap:', error);
    throw new Error('Failed to monitor swap');
  }
}

// Fetch Bitcoin UTXOs
async function getBTCUTXOs(address: string): Promise<any[]> {
  try {
    const response = await axios.get(`https://blockstream.info/api/address/${address}/utxo`);
    return response.data;
  } catch (error) {
    console.error('Error fetching BTC UTXOs:', error);
    throw new Error('Failed to fetch BTC UTXOs');
  }
}