import * as bitcoin from 'bitcoinjs-lib';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import axios from 'axios';

const ECPair = ECPairFactory(ecc);

// Use the correct network
const network = bitcoin.networks.bitcoin; // Use bitcoin.networks.testnet for testnet

export const generateWallet = () => {
  const keyPair = ECPair.makeRandom({ network });
  const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network }) || {};
  const privateKey = keyPair.toWIF();
  return { address: address || '', privateKey };
};

export const getBalance = async (address: string) => {
  const response = await axios.get(`https://blockchain.info/q/addressbalance/${address}`);
  return response.data;
};

export const createTransaction = async (senderPrivateKey: string, recipientAddress: string, amount: number, fee: number) => {
  const keyPair = ECPair.fromWIF(senderPrivateKey, network);
  const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network }) || {};

  const { data } = await axios.get(`https://blockchain.info/unspent?active=${address}`);
  const utxos = data.unspent_outputs;

  const psbt = new bitcoin.Psbt({ network });
  let inputAmount = 0;

  utxos.forEach((utxo: any) => {
    psbt.addInput({
      hash: utxo.tx_hash_big_endian,
      index: utxo.tx_output_n,
      nonWitnessUtxo: Buffer.from(utxo.script, 'hex'),
    });
    inputAmount += utxo.value;
  });

  psbt.addOutput({
    address: recipientAddress,
    value: amount,
  });

  const change = inputAmount - amount - fee;
  if (change > 0) {
    psbt.addOutput({
      address: address || '', // Ensure address is a string
      value: change,
    });
  }

  psbt.signAllInputs(keyPair);
  psbt.finalizeAllInputs();

  const tx = psbt.extractTransaction();
  return tx.toHex();
};