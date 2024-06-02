import * as bitcoin from 'bitcoinjs-lib';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import axios from 'axios';

const ECPair = ECPairFactory(ecc);
const network = bitcoin.networks.testnet;  // Use the correct network for testnet

export const generateWallet = () => {
  const keyPair = ECPair.makeRandom({ network });
  const { address } = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network }) || {};
  const privateKey = keyPair.toWIF();
  return { address: address || '', privateKey };
};

export const getBalance = async (address: string) => {
  const response = await axios.get(`https://api.blockcypher.com/v1/btc/test3/addrs/${address}/balance`);
  return response.data.balance;
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

  const response = await axios.get(`https://api.blockcypher.com/v1/btc/test3/addrs/${address}?unspentOnly=true`);
  const utxos = response.data.txrefs || [];
  const unconfirmedUtxos = response.data.unconfirmed_txrefs || [];
  const allUtxos = [...utxos, ...unconfirmedUtxos];

  if (allUtxos.length === 0) {
    throw new Error('No UTXOs available for the address');
  }

  const psbt = new bitcoin.Psbt({ network });
  let inputAmount = 0;

  for (const utxo of allUtxos) {
    const rawTxResponse = await axios.get(`https://api.blockcypher.com/v1/btc/test3/txs/${utxo.tx_hash}?includeHex=true`);
    if (!rawTxResponse.data || !rawTxResponse.data.vout || rawTxResponse.data.vout.length <= utxo.tx_output_n) {
      console.error(`Output index ${utxo.tx_output_n} out of bounds for transaction hash: ${utxo.tx_hash}`);
      throw new Error(`Transaction output index out of bounds or missing for tx_hash: ${utxo.tx_hash}`);
    }

    const txOutput = rawTxResponse.data.vout[utxo.tx_output_n];
    psbt.addInput({
      hash: utxo.tx_hash,
      index: utxo.tx_output_n,
      witnessUtxo: {
        script: Buffer.from(txOutput.scriptPubKey.hex, 'hex'),
        value: txOutput.value,
      },
    });
    inputAmount += txOutput.value;
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