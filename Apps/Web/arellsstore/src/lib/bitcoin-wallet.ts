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
  // Generate a wallet ID (UUID)
  const walletId = uuidv4();
  
  try {
    // Generate a random key pair using ECPair
    // Using makeRandom ensures proper key generation
    const keyPair = bitcoin.ECPair.makeRandom({ 
      network: bitcoin.networks.bitcoin 
    });
    
    if (!keyPair.privateKey) {
      throw new Error('Failed to generate private key');
    }
    
    // Get the private key as a hex string (32 bytes = 64 hex characters)
    const privateKey = keyPair.privateKey.toString('hex');
    
    // Ensure private key is 64 characters (32 bytes)
    if (privateKey.length !== 64) {
      throw new Error('Invalid private key length');
    }
    
    // Get the public key
    const publicKey = keyPair.publicKey;
    
    if (!publicKey) {
      throw new Error('Failed to generate public key');
    }
    
    // Create a P2PKH (Pay to Public Key Hash) address
    // This is the traditional Bitcoin address format (starts with 1)
    // Most compatible format for all Bitcoin wallets
    const payment = bitcoin.payments.p2pkh({
      pubkey: publicKey,
      network: bitcoin.networks.bitcoin,
    });
    
    const address = payment.address;
    
    if (!address) {
      throw new Error('Failed to generate Bitcoin address');
    }
    
    // Validate the address format - P2PKH addresses start with '1'
    // This is the most compatible format
    if (!address.startsWith('1')) {
      console.warn('Generated address does not start with 1:', address);
      // Force P2PKH format using payments.p2pkh with explicit format
      const p2pkhPayment = bitcoin.payments.p2pkh({
        pubkey: publicKey,
        network: bitcoin.networks.bitcoin,
      });
      const p2pkhAddress = p2pkhPayment.address;
      
      if (p2pkhAddress && p2pkhAddress.startsWith('1')) {
        return {
          address: p2pkhAddress,
          privateKey: privateKey,
          walletId: walletId,
        };
      }
      // If still not P2PKH, use the generated address anyway
      console.warn('Using generated address format:', address);
    }
    
    return {
      address: address,
      privateKey: privateKey,
      walletId: walletId,
    };
  } catch (error) {
    console.error('Error generating Bitcoin wallet:', error);
    throw error; // Don't return invalid addresses
  }
};
