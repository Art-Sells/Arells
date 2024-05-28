import * as bitcoin from 'bitcoinjs-lib';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';

const ECPair = ECPairFactory(ecc);
const network = bitcoin.networks.testnet;

export const generateWallet = () => {
  const keyPair = ECPair.makeRandom({ network });
  const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network });
  const privateKey = keyPair.toWIF();
  return { address, privateKey };
};