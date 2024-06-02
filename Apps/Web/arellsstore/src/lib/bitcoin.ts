import * as bitcoin from 'bitcoinjs-lib';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import axios from 'axios';

const ECPair = ECPairFactory(ecc);
const network = bitcoin.networks.bitcoin;  // Use the correct network for mainnet

export const generateWallet = () => {
  const keyPair = ECPair.makeRandom({ network });
  const payment = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network });
  const privateKey = keyPair.toWIF();
  return {
    address: payment.address || '', // Ensure this is always a string
    privateKey
  };
};

export const getBalance = async (address: string) => {
  const response = await axios.get(`https://blockchain.info/q/addressbalance/${address}`);
  return response.data;
};

export const loadWallet = (address: string, privateKey: string) => {
  try {
    const keyPair = ECPair.fromWIF(privateKey, network);
    const { pubkey } = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network });
    const derivedAddress = bitcoin.payments.p2wpkh({ pubkey, network }).address;
    return address === derivedAddress ? { address, privateKey } : null;
  } catch (error) {
    console.error('Error loading wallet:', error);
    return null;
  }
};

export const createTransaction = async (senderPrivateKey: string, recipientAddress: string, amount: number, fee: number) => {
  const keyPair = ECPair.fromWIF(senderPrivateKey, network);
  const payment = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network });

  if (!payment.address) {
    throw new Error('Failed to derive address');
  }
  const address = payment.address;

  const response = await axios.get(`https://blockchain.info/unspent?active=${address}`);
  const utxos = response.data.unspent_outputs || [];

  if (utxos.length === 0) {
    throw new Error('No UTXOs available for the address');
  }

  const psbt = new bitcoin.Psbt({ network });
  let inputAmount = 0;

  for (const utxo of utxos) {
    if (!utxo.script || utxo.tx_output_n === undefined) {
      throw new Error(`Missing data for UTXO with transaction hash: ${utxo.tx_hash_big_endian}`);
    }

    psbt.addInput({
      hash: utxo.tx_hash_big_endian,
      index: utxo.tx_output_n,
      witnessUtxo: {
        script: Buffer.from(utxo.script, 'hex'),
        value: utxo.value,
      },
    });
    inputAmount += utxo.value;
  }

  psbt.addOutput({ address: recipientAddress, value: amount });
  const change = inputAmount - amount - fee;
  if (change > 0) {
    psbt.addOutput({ address, value: change });
  }

  psbt.signAllInputs(keyPair);
  psbt.finalizeAllInputs();
  return psbt.extractTransaction().toHex();
};