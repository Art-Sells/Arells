import * as bitcoin from 'bitcoinjs-lib';
import axios from 'axios';
import axiosRetry from 'axios-retry';

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

export const loadTinySecp256k1 = async () => {
  const tinySecp256k1 = await import('tiny-secp256k1');
  return tinySecp256k1;
};

export const generateWallet = async () => {
  const tinySecp256k1 = await loadTinySecp256k1();
  const ECPairFactory = (await import('ecpair')).default;
  const ECPair = ECPairFactory(tinySecp256k1);
  const keyPair = ECPair.makeRandom();

  // Convert publicKey to Buffer for bitcoinjs-lib compatibility
  const { address } = bitcoin.payments.p2pkh({ pubkey: Buffer.from(keyPair.publicKey) });
  const privateKey = keyPair.toWIF();
  return { address, privateKey };
};

export const getBalance = async (address: string) => {
  const response = await axios.get(`https://blockchain.info/q/addressbalance/${address}`);
  return response.data;
};

export const loadWallet = async (address: string, privateKey: string) => {
  const tinySecp256k1 = await loadTinySecp256k1();
  const ECPairFactory = (await import('ecpair')).default;
  const ECPair = ECPairFactory(tinySecp256k1);
  try {
    const keyPair = ECPair.fromWIF(privateKey);

    // Convert publicKey to Buffer for bitcoinjs-lib compatibility
    const derivedAddress = bitcoin.payments.p2pkh({ pubkey: Buffer.from(keyPair.publicKey) }).address;

    return address === derivedAddress ? { address, privateKey } : null;
  } catch (error) {
    console.error('Error loading wallet:', error);
    return null;
  }
};

export const createTransaction = async (
  senderPrivateKey: string,
  recipientAddress: string,
  amount: number,
  fee: number
): Promise<{ txHex: string; txId: string }> => {
  const tinySecp256k1 = await loadTinySecp256k1();
  const ECPairFactory = (await import('ecpair')).default;
  const ECPair = ECPairFactory(tinySecp256k1);

  const keyPair = ECPair.fromWIF(senderPrivateKey);

  // Create a custom signer wrapper for compatibility
  const customSigner = {
    publicKey: Buffer.from(keyPair.publicKey), // Convert publicKey to Buffer
    sign: (hash: Buffer) => {
      return Buffer.from(keyPair.sign(hash)); // Ensure signed data is returned as Buffer
    },
  };

  const senderAddress = bitcoin.payments.p2pkh({ pubkey: customSigner.publicKey }).address!;

  // Get unspent transaction outputs (UTXOs) for the sender's address
  const utxosResponse = await axios.get(`https://blockchain.info/unspent?active=${senderAddress}`);
  const utxos = utxosResponse.data.unspent_outputs;

  // Log UTXOs for debugging
  console.log('Fetched UTXOs:', utxos);

  const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });

  let inputSum = 0;
  for (const utxo of utxos) {
    const utxoTxResponse = await axios.get(`https://blockchain.info/rawtx/${utxo.tx_hash_big_endian}?format=hex`);
    const utxoTxHex = utxoTxResponse.data;

    psbt.addInput({
      hash: utxo.tx_hash_big_endian,
      index: utxo.tx_output_n,
      nonWitnessUtxo: Buffer.from(utxoTxHex, 'hex'),
    });

    inputSum += utxo.value;
    if (inputSum >= amount + fee) break;
  }

  if (inputSum < amount + fee) {
    throw new Error('Insufficient balance');
  }

  psbt.addOutput({
    address: recipientAddress,
    value: amount,
  });

  const change = inputSum - amount - fee;
  if (change > 0) {
    psbt.addOutput({
      address: senderAddress,
      value: change,
    });
  }

  psbt.signAllInputs(customSigner); // Use the custom signer
  psbt.finalizeAllInputs();

  const tx = psbt.extractTransaction();
  const txHex = tx.toHex();
  const txId = tx.getId(); // Extract txid from the transaction

  // Log the final transaction hex for debugging
  console.log('Created transaction hex:', txHex);
  console.log('Transaction ID:', txId);

  return { txHex, txId };
};

export default { getBalance, loadWallet, createTransaction };