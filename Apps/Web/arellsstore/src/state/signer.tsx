'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";
import CryptoJS from "crypto-js";
import axios from "axios";
import { fetchUserAttributes } from "aws-amplify/auth";

const TOKEN_ADDRESSES = {
  WBTC_ARB: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", // WBTC on Arbitrum
  USDC_ARB: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // USDC on Arbitrum
};

const provider_ARB = new ethers.JsonRpcProvider(
  `https://arbitrum-mainnet.infura.io/v3/4885ed01637e4a6f91c2c7fcd1714f68`
);

interface SignerContextType {
  MASSaddress: string;
  MASSsupplicationAddress: string;
  MASSPrivateKey: string;
  MASSsupplicationPrivateKey: string;
  email: string;
  balances: {
    WBTC_ARB: string;
    USDC_ARB: string;
  };
  createWallets: () => Promise<void>;
}

const SignerContext = createContext<SignerContextType | undefined>(undefined);

export const SignerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [MASSaddress, setMASSaddress] = useState<string>("");
  const [MASSsupplicationAddress, setMASSsupplicationAddress] = useState<string>("");
  const [MASSPrivateKey, setMASSPrivateKey] = useState<string>("");
  const [MASSsupplicationPrivateKey, setMASSsupplicationPrivateKey] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [balances, setBalances] = useState({
    WBTC_ARB: "0",
    USDC_ARB: "0",
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
      await createMASSWallet();
    } catch (error) {
      console.error("Error creating wallets:", error);
    }
  };

  useEffect(() => {
    const fetchWalletDetails = async () => {
      try {
        await readMASSFile();
      } catch (error) {
        console.error('Error fetching wallet details:', error);
      }
    };

    fetchWalletDetails();
  }, []);

  useEffect(() => {
    const loadBalances = async () => {
      if (!MASSaddress || !MASSsupplicationAddress) return;
  
      try {
  
        // WBTC on Arbitrum
        const WBTCContract_ARB = new ethers.Contract(
          TOKEN_ADDRESSES.WBTC_ARB,
          ["function balanceOf(address owner) view returns (uint256)"],
          provider_ARB
        );
  
        // USDC on Polygon
        const USDCContract_ARB = new ethers.Contract(
          TOKEN_ADDRESSES.USDC_ARB,
          ["function balanceOf(address owner) view returns (uint256)"],
          provider_ARB
        );
  
        const [WBTC_ARB, USDC_ARB] = await Promise.all([
          WBTCContract_ARB.balanceOf(MASSaddress), // Balance on Arbitrum
          USDCContract_ARB.balanceOf(MASSsupplicationAddress), // USDC on Polygon
        ]);
  
        setBalances({
          WBTC_ARB: ethers.formatUnits(WBTC_ARB, 8),
          USDC_ARB: ethers.formatUnits(USDC_ARB, 6),
        });
      } catch (error) {
        console.error("Error fetching balances:", error);
      }
    };
  
    loadBalances();
  }, [MASSaddress, MASSsupplicationAddress]);

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

      } catch (error) {
        console.error('Error fetching user attributes or wallet details:', error);
      }
    };
  
    fetchWalletDetails();
  }, [readMASSFile]);

  return (
    <SignerContext.Provider
      value={{
        MASSaddress,
        MASSsupplicationAddress,
        MASSPrivateKey,
        MASSsupplicationPrivateKey,
        email,
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