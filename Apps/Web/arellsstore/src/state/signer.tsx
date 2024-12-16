'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";
import CryptoJS from "crypto-js";
import axios from "axios";
import { fetchUserAttributes } from "aws-amplify/auth";

const TOKEN_ADDRESSES = {
  WBTC_POL: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", // WBTC on Polygon
  WBTC_ARB: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", // WBTC on Arbitrum
  USDC_POL: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC on Polygon
};

const provider_POL = new ethers.JsonRpcProvider(
  `https://polygon-mainnet.infura.io/v3/4885ed01637e4a6f91c2c7fcd1714f68`
);

const provider_ARB = new ethers.JsonRpcProvider(
  `https://arbitrum-mainnet.infura.io/v3/4885ed01637e4a6f91c2c7fcd1714f68`
);

interface SignerContextType {
  MASSaddress: string;
  MASSsupplicationAddress: string;
  wrappedBitcoinAddress: string;
  wrappedBitcoinPrivateKey: string;
  MASSPrivateKey: string;
  MASSsupplicationPrivateKey: string;
  email: string;
  wrappedBitcoinBalance: number | null;
  balances: {
    WBTC_POL: string;
    WBTC_ARB: string;
    USDC_POL: string;
  };
  createWallets: () => Promise<void>;
}

const SignerContext = createContext<SignerContextType | undefined>(undefined);

export const SignerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [MASSaddress, setMASSaddress] = useState<string>("");
  const [MASSsupplicationAddress, setMASSsupplicationAddress] = useState<string>("");
  const [wrappedBitcoinAddress, setWrappedBitcoinAddress] = useState<string>("");
  const [wrappedBitcoinPrivateKey, setWrappedBitcoinPrivateKey] = useState<string>("");
  const [MASSPrivateKey, setMASSPrivateKey] = useState<string>("");
  const [MASSsupplicationPrivateKey, setMASSsupplicationPrivateKey] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [wrappedBitcoinBalance, setWrappedBitcoinBalance] = useState<number | null>(null);
  const [balances, setBalances] = useState({
    WBTC_POL: "0",
    WBTC_ARB: "0",
    USDC_POL: "0",
  });

  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const attributesResponse = await fetchUserAttributes();
        setEmail(attributesResponse.email ?? '');
      } catch (error) {
        console.error('Error fetching user attributes:', error);
      }
    };

    fetchAttributes();
  }, []);

  const fetchWrappedBitcoinBalance = async (address: string) => {
    if (!address) return;
    try {
      console.log("Fetching WBTC balance for address:", address);
      const WBTCContract_POL = new ethers.Contract(
        TOKEN_ADDRESSES.WBTC_POL,
        ["function balanceOf(address owner) view returns (uint256)"],
        provider_POL
      );
      const balance = await WBTCContract_POL.balanceOf(address);
      setWrappedBitcoinBalance(parseFloat(ethers.formatUnits(balance, 8))); // WBTC uses 8 decimals
    } catch (error) {
      console.error("Error fetching WBTC balance:", error);
      setWrappedBitcoinBalance(null);
    }
  };

  const readWBTCFile = async (): Promise<{ WBTCaddress: string; WBTCkey: string } | null> => {
    try {
      if (!email) {
        console.warn('Reading email... Please wait');
        return null;
      }
  
      const response = await axios.get('/api/readWBTC', { params: { email } });
      const data = response.data;
  
      console.log('Read WBTC File:', data);
      setWrappedBitcoinAddress(data.WBTCaddress);
  
      const decryptedPrivateKey = CryptoJS.AES.decrypt(data.WBTCkey, 'your-secret-key').toString(
        CryptoJS.enc.Utf8
      );
      setWrappedBitcoinPrivateKey(decryptedPrivateKey);
  
      return data;
    } catch (error) {
      console.error('Error reading WBTC file:', error);
      return null;
    }
  };

  const readMASSFile = async (): Promise<{
    MASSaddress: string;
    MASSsupplicationAddress: string;
    MASSkey: string;
    MASSsupplicationKey: string;
  } | null> => {
    try {
      if (!email) {
        console.warn("Reading email... Please wait");
        return null;
      }
  
      const response = await axios.get('/api/readMASS', { params: { email } });
      const data = response.data;
      console.log('Read MASS File:', data);
      setMASSaddress(data.MASSaddress);
      setMASSsupplicationAddress(data.MASSsupplicationAddress);
      return data;
    } catch (error) {
      console.error('Error reading MASS file:', error);
      return null;
    }
  };

  const checkWBTCWalletExists = async (): Promise<boolean> => {
    if (!email) {
      console.warn('Email is not set. Cannot check WBTC wallet file existence.');
      return false;
    }
  
    try {
      const response = await axios.get(`/api/readWBTC`, { params: { email } });
      console.log('WBTC Wallet exists');
      return true; // File exists
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        console.log('WBTC wallet does not exist.');
        return false; // File does not exist
      }
      console.error('Error checking WBTC wallet file existence:', error);
      throw error;
    }
  };

  const createWBTCWallet = async () => {
    try {
      const fileExists = await checkWBTCWalletExists();
      if (fileExists) {
        console.log('Skipping WBTC wallet creation.');
        return;
      }
  
      const newWallet = ethers.Wallet.createRandom();
      const encryptedPrivateKey = CryptoJS.AES.encrypt(newWallet.privateKey, 'your-secret-key').toString();
  
      console.log('New WBTC Wallet Address:', newWallet.address);
      console.log('Encrypted Private Key for WBTC Wallet:', encryptedPrivateKey);
  
      await saveWBTCWalletDetails(newWallet.address, encryptedPrivateKey, email);
      setWrappedBitcoinAddress(newWallet.address);
      setWrappedBitcoinPrivateKey(encryptedPrivateKey);
    } catch (error) {
      console.error('Error creating WBTC wallet:', error);
    }
  };

  const saveWBTCWalletDetails = async (WBTCaddress: string, WBTCkey: string, email: string) => {
    try {
      const response = await fetch('/api/saveWBTC', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          WBTCaddress,
          WBTCkey,
          email,
        }),
      });
  
      const data = await response.json();
      console.log('Save WBTC Wallet Response:', data);
    } catch (error) {
      console.error('Error saving WBTC wallet details:', error);
    }
  };

  const checkMASSWalletExists = async (): Promise<boolean> => {
    if (!email) {
      console.warn('Email is not set. Cannot check MASS wallet file existence.');
      return false;
    }
  
    try {
      const response = await axios.get(`/api/readMASS`, { params: { email } });
      console.log('MASS Wallet exists');
      return true; // File exists
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        console.log('MASS wallet does not exist.');
        return false; // File does not exist
      }
      console.error('Error checking MASS wallet file existence:', error);
      throw error;
    }
  };

  const createMASSWallet = async () => {
    try {
      const fileExists = await checkMASSWalletExists();
      if (fileExists) {
        console.log('Skipping MASS wallet creation.');
        return;
      }

      const newWallet = ethers.Wallet.createRandom();
      const newSupplicationWallet = ethers.Wallet.createRandom();
      const encryptedPrivateKey = CryptoJS.AES.encrypt(newWallet.privateKey, 'your-secret-key').toString();
      const encryptedSupplicationPrivateKey = CryptoJS.AES.encrypt(newSupplicationWallet.privateKey, 'your-secret-key').toString();

      console.log("New MASS Wallet Address:", newWallet.address);
      console.log("New MASS Supplication Wallet Address:", newSupplicationWallet.address);

      await saveMASSWalletDetails(
        newWallet.address,
        newSupplicationWallet.address,
        encryptedPrivateKey,
        encryptedSupplicationPrivateKey,
        email
      );
      setMASSaddress(newWallet.address);
      setMASSsupplicationAddress(newSupplicationWallet.address);
    } catch (error) {
      console.error('Error creating MASS wallet:', error);
    }
  };

  const saveMASSWalletDetails = async (
    MASSaddress: string,
    MASSsupplicationAddress: string,
    MASSkey: string,
    MASSsupplicationKey: string,
    email: string
  ) => {
    try {
      const response = await fetch('/api/saveMASS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          MASSaddress,
          MASSsupplicationAddress,
          MASSkey,
          MASSsupplicationKey,
          email,
        }),
      });
      const data = await response.json();
      console.log('Save MASS Wallet Response:', data);
    } catch (error) {
      console.error('Error saving MASS wallet details:', error);
    }
  };

  const createWallets = async () => {
    try {
      await createWBTCWallet();
      await createMASSWallet();
    } catch (error) {
      console.error("Error creating wallets:", error);
    }
  };

  useEffect(() => {
    const fetchWalletDetails = async () => {
      try {
        await readMASSFile();
        await readWBTCFile();
      } catch (error) {
        console.error('Error fetching wallet details:', error);
      }
    };

    fetchWalletDetails();
  }, []);

  useEffect(() => {
    const loadBalances = async () => {
      if (!MASSaddress || !MASSsupplicationAddress || !wrappedBitcoinAddress) return;
  
      try {
        // WBTC on Polygon
        const WBTCContract_POL = new ethers.Contract(
          TOKEN_ADDRESSES.WBTC_POL,
          ["function balanceOf(address owner) view returns (uint256)"],
          provider_POL
        );
  
        // WBTC on Arbitrum
        const WBTCContract_ARB = new ethers.Contract(
          TOKEN_ADDRESSES.WBTC_ARB,
          ["function balanceOf(address owner) view returns (uint256)"],
          provider_ARB
        );
  
        // USDC on Polygon
        const USDCContract_POL = new ethers.Contract(
          TOKEN_ADDRESSES.USDC_POL,
          ["function balanceOf(address owner) view returns (uint256)"],
          provider_POL
        );
  
        const [WBTC_POL, WBTC_ARB, USDC_POL] = await Promise.all([
          WBTCContract_POL.balanceOf(MASSaddress), // Balance on Polygon
          WBTCContract_ARB.balanceOf(wrappedBitcoinAddress), // Balance on Arbitrum
          USDCContract_POL.balanceOf(MASSsupplicationAddress), // USDC on Polygon
        ]);
  
        setBalances({
          WBTC_POL: ethers.formatUnits(WBTC_POL, 8),
          WBTC_ARB: ethers.formatUnits(WBTC_ARB, 8),
          USDC_POL: ethers.formatUnits(USDC_POL, 6),
        });
      } catch (error) {
        console.error("Error fetching balances:", error);
      }
    };
  
    loadBalances();
  }, [MASSaddress, MASSsupplicationAddress, wrappedBitcoinAddress]);

  useEffect(() => {
    const fetchWalletDetails = async () => {
      try {
        // Fetch MASS details
        const massDetails = await readMASSFile();
        if (massDetails) {
          setMASSaddress(massDetails.MASSaddress);
          setMASSsupplicationAddress(massDetails.MASSsupplicationAddress);
          setMASSPrivateKey(
            CryptoJS.AES.decrypt(massDetails.MASSkey, 'your-secret-key').toString(CryptoJS.enc.Utf8)
          );
          setMASSsupplicationPrivateKey(
            CryptoJS.AES.decrypt(massDetails.MASSsupplicationKey, 'your-secret-key').toString(CryptoJS.enc.Utf8)
          );
        }
  
        // Fetch WBTC details
        const wbtcDetails = await readWBTCFile();
        if (wbtcDetails) {
          setWrappedBitcoinAddress(wbtcDetails.WBTCaddress);
          setWrappedBitcoinPrivateKey(
            CryptoJS.AES.decrypt(wbtcDetails.WBTCkey, 'your-secret-key').toString(CryptoJS.enc.Utf8)
          );
        }
      } catch (error) {
        console.error('Error fetching user attributes or wallet details:', error);
      }
    };
  
    fetchWalletDetails();
  }, [readWBTCFile, readMASSFile]);

  return (
    <SignerContext.Provider
      value={{
        MASSaddress,
        MASSsupplicationAddress,
        wrappedBitcoinAddress,
        wrappedBitcoinPrivateKey,
        MASSPrivateKey,
        MASSsupplicationPrivateKey,
        email,
        wrappedBitcoinBalance,
        balances,
        createWallets,
      }}
    >
      {children}
    </SignerContext.Provider>
  );
};

export const useSigner = () => {
  const context = useContext(SignerContext);
  if (!context) throw new Error("useSigner must be used within a SignerProvider");
  return context;
};