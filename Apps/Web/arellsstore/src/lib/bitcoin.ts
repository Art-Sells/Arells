import * as bitcoin from 'bitcoinjs-lib';
import axios from 'axios';
import axiosRetry from 'axios-retry';

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

const loadTinySecp256k1 = async () => {
  const tinySecp256k1 = await import('tiny-secp256k1');
  return tinySecp256k1;
};

export const generateWallet = async () => {
  const tinySecp256k1 = await loadTinySecp256k1();
  const ECPairFactory = (await import('ecpair')).default;
  const ECPair = ECPairFactory(tinySecp256k1);
  const keyPair = ECPair.makeRandom();
  const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
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
    const derivedAddress = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey }).address;
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
): Promise<string> => {
  const tinySecp256k1 = await loadTinySecp256k1();
  const ECPairFactory = (await import('ecpair')).default;
  const ECPair = ECPairFactory(tinySecp256k1);

  const keyPair = ECPair.fromWIF(senderPrivateKey);

  // Get unspent transaction outputs (UTXOs) for the sender's address
  const senderAddress = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey }).address!;
  const utxosResponse = await axios.get(`https://blockchain.info/unspent?active=${senderAddress}`);
  const utxos = utxosResponse.data.unspent_outputs;

  const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });

  let inputSum = 0;
  for (const utxo of utxos) {
    psbt.addInput({
      hash: utxo.tx_hash_big_endian,
      index: utxo.tx_output_n,
      nonWitnessUtxo: Buffer.from(utxo.script, 'hex'),
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

  psbt.signAllInputs(keyPair);
  psbt.finalizeAllInputs();

  return psbt.extractTransaction().toHex();
};

export default { getBalance, loadWallet, createTransaction };