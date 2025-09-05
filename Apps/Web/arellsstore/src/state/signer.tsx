'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";
import CryptoJS from "crypto-js";
import axios from "axios";
import { fetchUserAttributes } from "aws-amplify/auth";
import { v4 as uuidv4 } from 'uuid';

const TOKEN_ADDRESSES = {
  BTC_BASE: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", 
  USDC_BASE: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", 
};

const provider_BASE = new ethers.JsonRpcProvider(
  `https://base-mainnet.infura.io/v3/4885ed01637e4a6f91c2c7fcd1714f68`
);

interface SignerContextType {
  MASSaddress: string;
  MASSPrivateKey: string;
  userAddress: string;
  userPrivateKey: string;
  MASSWalletId: string;
  email: string;
  balances: {
    BTC_BASE: string;
    USDC_BASE: string;
  };
  createWallet: () => Promise<void>;
  createMASSWallets: () => Promise<void>;
  loadBalances: () => Promise<void>;
}

const SignerContext = createContext<SignerContextType | undefined>(undefined);

export const SignerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [MASSWalletId, setMASSWalletId] = useState<string>("");
  const [MASSaddress, setMASSaddress] = useState<string>("");
  const [MASSPrivateKey, setMASSPrivateKey] = useState<string>("");
  const [userAddress, setUserAddress] = useState<string>("");
  const [userPrivateKey, setUserPrivateKey] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [balances, setBalances] = useState({
    BTC_BASE: "0",
    USDC_BASE: "0",
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

    if(!MASSaddress || !userAddress) {
      return;
    }

    loadBalances();
  }, []);




















    //User Wallet functions:
  const readUserFile = async (): Promise<{
    userAddress: string;
    userKey: string;
  } | null> => {
    try {
      if (!email) {
        console.warn("Reading email... Please wait");
        return null;
      }
  
      const response = await axios.get('/api/readUserWallet', { params: { email } });
      const data = response.data;
      setUserAddress(data.userAddress);
      return data;
    } catch (error) {
      console.error('Error reading User File:', error);
      return null;
    }
  };

  const checkUserWalletExists = async (): Promise<boolean> => {
    if (!email) {
      console.warn('Email is not set. Cannot check User Wallet file existence.');
      return false;
    }
  
    try {
      await axios.get(`/api/readUserWallet`, { params: { email } });
      console.log('User Wallet exists');
      return true; // File exists
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        console.log('User Wallet does not exist.');
        return false; // File does not exist
      }
      console.error('Error checking User Wallet file existence:', error);
      throw error;
    }
  };

  const createUserWallet = async () => {
    try {
      const fileExists = await checkUserWalletExists();
      if (fileExists) {
        console.log('Skipping User Wallet creation.');
        return;
      }

      const newWallet = ethers.Wallet.createRandom();
      const encryptedPrivateKey = CryptoJS.AES.encrypt(newWallet.privateKey, 'your-secret-key').toString();

      await saveUserWalletDetails(
        newWallet.address,
        encryptedPrivateKey,
        email
      );
      setUserAddress(newWallet.address);
    } catch (error) {
      console.error('Error creating User Wallet:', error);
    }
  };

  const saveUserWalletDetails = async (
    userAddress: string,
    userKey: string,
    email: string
  ) => {
    try {
      const response = await fetch('/api/saveUserWallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress,
          userKey,
          email,
        }),
      });
      console.log(' User Wallet saved');
    } catch (error) {
      console.error('Error saving User Wallet details:', error);
    }
  };
























  //MASS wallet functions:
  const readMASSFile = async (): Promise<{
    MASSaddress: string;
    MASSkey: string;
  } | null> => {
    try {
      if (!email) {
        console.warn("Reading email... Please wait");
        return null;
      }
      const response = await axios.get('/api/readMASS', { params: { email } });
      const data = response.data;
      setMASSaddress(data.MASSaddress);
      if (data.id) setMASSWalletId(data.id); 
      return data;
    } catch (error) {
      console.error('Error reading MASS file:', error);
      return null;
    }
  };


const createMASSWallet = async () => {
  try {
    const newWallet = ethers.Wallet.createRandom();
    const encryptedPrivateKey = CryptoJS.AES.encrypt(
      newWallet.privateKey,
      "your-secret-key"
    ).toString();

    const MASSid = uuidv4(); 

    await saveMASSWalletDetails(
      newWallet.address,
      encryptedPrivateKey,
      email,
      MASSid
    );

    setMASSaddress(newWallet.address);
  } catch (error) {
    console.error("Error creating MASS wallet:", error);
  }
};

const saveMASSWalletDetails = async (
  MASSaddress: string,
  MASSkey: string,
  email: string,
  MASSid: string
) => {
  try {
    const response = await fetch('/api/saveMASS', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ MASSaddress, MASSkey, email }),
    });
    const json = await response.json();
    if (json?.id) setMASSWalletId(json.id);
    console.log('MASS Wallet saved');
  } catch (error) {
    console.error("Error saving MASS wallet details:", error);
  }
};
























  // User/MASS Wallet functions:
  const createWallet = async () => {
    try {
      await createUserWallet();
    } catch (error) {
      console.error("Error creating User Wallet:", error);
    }
  };

  const createMASSWallets = async () => {
    try {
      await createMASSWallet();
    } catch (error) {
      console.error("Error creating MASS Wallet/s:", error);
    }
  };

  useEffect(() => {
    const fetchWalletDetails = async () => {
      try {
        await readUserFile();
        await readMASSFile();
      } catch (error) {
        console.error('Error fetching wallet details:', error);
      }
    };

    fetchWalletDetails();
  }, []);


  const loadBalances = async () => {
    try {

      const BTCContract_BASE = new ethers.Contract(
        TOKEN_ADDRESSES.BTC_BASE,
        ["function balanceOf(address owner) view returns (uint256)"],
        provider_BASE
      );

      const USDCContract_BASE = new ethers.Contract(
        TOKEN_ADDRESSES.USDC_BASE,
        ["function balanceOf(address owner) view returns (uint256)"],
        provider_BASE
      );

      const [BTC_BASE, USDC_BASE] = await Promise.all([
        BTCContract_BASE.balanceOf(MASSaddress), // BTC on Base
        USDCContract_BASE.balanceOf(MASSaddress), // USDC on Base
      ]);

      setBalances({
        BTC_BASE: ethers.formatUnits(BTC_BASE, 8),
        USDC_BASE: ethers.formatUnits(USDC_BASE, 6),
      });
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  useEffect(() => {
    const fetchWalletDetails = async () => {
      try {
        // Fetch User details
        const userWalletDetails = await readUserFile();
        if (userWalletDetails) {
          setUserAddress(userWalletDetails.userAddress);
          setUserPrivateKey(
            CryptoJS.AES.decrypt(userWalletDetails.userKey, 'your-secret-key').toString(CryptoJS.enc.Utf8)
          );
        }
        // Fetch MASS details
        const massDetails = await readMASSFile();
        if (massDetails) {
          setMASSaddress(massDetails.MASSaddress);
          setMASSPrivateKey(
            CryptoJS.AES.decrypt(massDetails.MASSkey, 'your-secret-key').toString(CryptoJS.enc.Utf8)
          );
        }

      } catch (error) {
        console.error('Error fetching user attributes or wallet details:', error);
      }
    };
  
    fetchWalletDetails();
  }, [readMASSFile, readUserFile]);

  return (
    <SignerContext.Provider
      value={{
        MASSWalletId,
        MASSaddress,
        MASSPrivateKey,
        userAddress,
        userPrivateKey,
        email,
        balances,
        createWallet,
        createMASSWallets,
        loadBalances,
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