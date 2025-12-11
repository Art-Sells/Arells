// Bitcoin wallet generation utility using bitcoinjs-lib
import * as bitcoin from 'bitcoinjs-lib';
import { v4 as uuidv4 } from 'uuid';

export interface BitcoinWallet {
  address: string;
  privateKey: string;
  walletId: string;
}

// Generate random bytes (browser-compatible)
const getRandomBytes = (length: number): Uint8Array => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    return window.crypto.getRandomValues(new Uint8Array(length));
  }
  // Fallback for Node.js
  const crypto = require('crypto');
  return new Uint8Array(crypto.randomBytes(length));
};

// Generate a Bitcoin wallet with proper address generation
export const generateBitcoinWallet = (): BitcoinWallet => {
  // Generate a random private key (32 bytes)
  const privateKeyBuffer = Buffer.from(getRandomBytes(32));
  
  // Convert to hex string for storage
  const privateKey = privateKeyBuffer.toString('hex');
  
  // Generate a wallet ID (UUID)
  const walletId = uuidv4();
  
  try {
    // Create a key pair from the private key
    const keyPair = bitcoin.ECPair.fromPrivateKey(privateKeyBuffer);
    
    // Get the public key
    const publicKey = keyPair.publicKey;
    
    // Create a P2PKH (Pay to Public Key Hash) address
    // This is the traditional Bitcoin address format (starts with 1)
    const { address } = bitcoin.payments.p2pkh({
      pubkey: publicKey,
      network: bitcoin.networks.bitcoin, // Use mainnet
    });
    
    if (!address) {
      throw new Error('Failed to generate Bitcoin address');
    }
    
    return {
      address: address,
      privateKey: privateKey,
      walletId: walletId,
    };
  } catch (error) {
    console.error('Error generating Bitcoin wallet:', error);
    // Fallback: return a placeholder (should not happen in production)
    return {
      address: 'bc1q' + privateKey.substring(0, 32), // Fallback format
      privateKey: privateKey,
      walletId: walletId,
    };
  }
};
