import * as bitcoin from 'bitcoinjs-lib';
import axios from 'axios';

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