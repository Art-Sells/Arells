'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";
import CryptoJS from "crypto-js";
import axios from "axios";
import { fetchUserAttributes } from "aws-amplify/auth";
import { JsonRpcProvider } from "ethers";
import {generateWallet} from "../lib/bitcoin";
import Image from 'next/image';
import stylings from '../app/css/modals/loading/marketplaceloader.module.css';
import '../app/css/modals/sell/sell-modal.css';

const provider = new JsonRpcProvider(
  `https://polygon-mainnet.infura.io/v3/4885ed01637e4a6f91c2c7fcd1714f68`
);

const TOKEN_ADDRESSES = {
  WBTC: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", // WBTC contract address
  USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC contract address
};

interface SignerContextType {
  MASSaddress: string;
  MASSsupplicationAddress: string;
  bitcoinAddress: string;
  bitcoinPrivateKey: string;
  MASSPrivateKey: string;
  MASSsupplicationPrivateKey: string;
  email: string;
  bitcoinBalance: number | null;
  balances: {
    WBTC: string;
    USDC: string;
    POL_MASS: string;
    POL_SUPPLICATION: string;
  };
  createWallets: () => Promise<void>;
}

const SignerContext = createContext<SignerContextType | undefined>(undefined);

export const SignerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [MASSaddress, setMASSaddress] = useState<string>("");
  const [MASSsupplicationAddress, setMASSsupplicationAddress] = useState<string>("");
  const [bitcoinAddress, setBitcoinAddress] = useState<string>("");
  const [bitcoinPrivateKey, setBitcoinPrivateKey] = useState<string>("");
  const [MASSPrivateKey, setMASSPrivateKey] = useState<string>("");
  const [MASSsupplicationPrivateKey, setMASSsupplicationPrivateKey] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [bitcoinBalance, setBitcoinBalance] = useState<number | null>(null);
  const [balances, setBalances] = useState({
    WBTC: "0",
    USDC: "0",
    POL_MASS: "0",
    POL_SUPPLICATION: "0",
  });


const [showImporting, setImporting] = useState<boolean>(false);

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














  const fetchBitcoinBalance = async (address: string) => {
    if (!address) {
      console.warn("Bitcoin address is not available. Skipping balance fetch.");
      setBitcoinBalance(null); // Explicitly set to null to avoid `NaN`
      return;
    }
  
    try {
      console.log("Fetching Bitcoin balance for address:", address);
      const res = await fetch(`/api/balance?address=${address}`);
      const data = await res.json();
      console.log("Raw API response for Bitcoin balance:", data); // Log the raw response
  
      // Check if data is a number (raw balance in satoshis)
      if (typeof data === "number") {
        setBitcoinBalance(data / 100000000); // Convert from satoshis to BTC
      } else {
        console.error("Invalid balance format from API:", data);
        setBitcoinBalance(0); // Fallback to 0 if the API returns invalid data
      }
    } catch (error) {
      console.error("Error fetching Bitcoin balance:", error);
      setBitcoinBalance(null); // Explicitly set to null on error
    }
  };

  useEffect(() => {
    if (bitcoinAddress) {
      fetchBitcoinBalance(bitcoinAddress);
    }
  }, [bitcoinAddress]);



  const readBTCFile = async (): Promise<{ BTCaddress: string; BTCkey: string } | null> => {
    try {
      if (!email) {
        console.warn('Reading email... Please wait');
        return null;
      }
  
      const response = await axios.get('/api/readBTC', { params: { email } });
      const data = response.data;
  
      console.log('Read BTC File:', data); // Log the data for debugging
      setBitcoinAddress(data.BTCaddress);
  
      const decryptedPrivateKey = CryptoJS.AES.decrypt(data.BTCkey, 'your-secret-key').toString(
        CryptoJS.enc.Utf8
      );
      setBitcoinPrivateKey(decryptedPrivateKey);
  
      return data;
    } catch (error) {
      console.error('Error reading BTC file:', error);
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
      console.log('Read MASS File:', data); // Log the data for debugging
      setMASSaddress(data.MASSaddress);
      setMASSsupplicationAddress(data.MASSsupplicationAddress);
      return data;
    } catch (error) {
      console.error('Error reading MASS file:', error);
      return null;
    }
  };


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
  
        // Fetch BTC details
        const btcDetails = await readBTCFile();
        if (btcDetails) {
          setBitcoinAddress(btcDetails.BTCaddress);
          setBitcoinPrivateKey(
            CryptoJS.AES.decrypt(btcDetails.BTCkey, 'your-secret-key').toString(CryptoJS.enc.Utf8)
          );
        }
      } catch (error) {
        console.error('Error fetching user attributes or wallet details:', error);
      }
    };
  
    fetchWalletDetails();
  }, [readBTCFile, readMASSFile]);

  useEffect(() => {
    const loadBalances = async () => {
      if (MASSaddress && MASSsupplicationAddress) {
        try {
          const WBTCContract = new ethers.Contract(
            TOKEN_ADDRESSES.WBTC,
            ["function balanceOf(address owner) view returns (uint256)"],
            provider
          );
          const USDCContract = new ethers.Contract(
            TOKEN_ADDRESSES.USDC,
            ["function balanceOf(address owner) view returns (uint256)"],
            provider
          );

          const WBTCBalance = await WBTCContract.balanceOf(MASSaddress);
          const USDCBalance = await USDCContract.balanceOf(MASSsupplicationAddress);
          const POLBalance_MASS = await provider.getBalance(MASSaddress);
          const POLBalance_SUPPLICATION = await provider.getBalance(MASSsupplicationAddress);

          setBalances({
            WBTC: ethers.formatUnits(WBTCBalance, 8),
            USDC: ethers.formatUnits(USDCBalance, 6),
            POL_MASS: ethers.formatEther(POLBalance_MASS),
            POL_SUPPLICATION: ethers.formatEther(POLBalance_SUPPLICATION),
          });
        } catch (error) {
          console.error("Error fetching balances:", error);
        }
      }
    };

    loadBalances();
  }, [MASSaddress, MASSsupplicationAddress]);
















  const checkBTCWalletExists = async (): Promise<boolean> => {
    if (!email) {
      console.warn('Email is not set. Cannot check BTC wallet file existence.');
      return false;
    }
  
    try {
      const response = await axios.get(`/api/readBTC`, { params: { email } });
      console.log('BTC Wallet exists');
      return true; // File exists
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        console.log('BTC wallet does not exist.');
        return false; // File does not exist
      }
      console.error('Error checking BTC wallet file existence:', error);
      throw error;
    }
  };
  const createBTCwallet = async () => {
    try {
      const fileExists = await checkBTCWalletExists();
      if (fileExists) {
        console.log('Skipping BTC wallet creation.');
        return;
      }

      setImporting(true);
  
      const { address, privateKey } = await generateWallet();
  
      if (!email || !address) {
        console.error('Email or address is undefined. Cannot create BTC wallet.');
        return;
      }
  
      // Encrypt the private key
      const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKey, 'your-secret-key').toString();
  
      console.log('New BTC Wallet Address:', address);
      console.log('Encrypted Private Key for BTC Wallet:', encryptedPrivateKey);
  
      // Save the wallet details to the server
      await saveBTCWalletDetails(address, encryptedPrivateKey, email);
  
      // Update state
      setBitcoinAddress(address);
      setBitcoinPrivateKey(encryptedPrivateKey);
    } catch (error) {
      console.error('Error creating BTC wallet:', error);
    }
  };
  const saveBTCWalletDetails = async (BTCaddress: string, BTCkey: string, email: string) => {
    try {
      const response = await fetch('/api/saveBTC', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BTCaddress,
          BTCkey,
          email,
        }),
      });
  
      const data = await response.json();
      console.log('Save BTC Wallet Response:', data);
    } catch (error) {
      console.error('Error saving BTC wallet details:', error);
    }
  };









  const checkMASSWalletExists = async (): Promise<boolean> => {
    if (!email) {
        console.warn('Email is not set. Cannot check wallet file existence.');
        return false;
    }

    try {
        const response = await axios.get(`/api/readMASS`, { params: { email } });
        console.log('MASS Wallet exists');
        return true; // File exists
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            console.log('MASSwallet does not exist.');
            return false; // File does not exist
        }
        console.error('Error checking MASSwallet file existence:', error);
        throw error;
    }
};


const createMASSwallet = async () => {
    try {
        const fileExists = await checkMASSWalletExists();
        if (fileExists) {
            console.log('Skipping wallet creation.');
            return;
        }

        const newWallet = ethers.Wallet.createRandom();
        const newSupplicationWallet = ethers.Wallet.createRandom();
        const encryptedPrivateKey = CryptoJS.AES.encrypt(newWallet.privateKey, 'your-secret-key').toString();
        const encryptedSupplicationPrivateKey = CryptoJS.AES.encrypt(newSupplicationWallet.privateKey, 'your-secret-key').toString();

        console.log("New Wallet Address:", newWallet.address);
        console.log("Encrypted Private Key for MASS Wallet:", encryptedPrivateKey);
        console.log("New MASS Supplication Wallet Address:", newSupplicationWallet.address);
        console.log("Encrypted Private Key for MASS Supplication Wallet:", encryptedSupplicationPrivateKey);

        await saveWalletDetails(newWallet.address, newSupplicationWallet.address, encryptedPrivateKey, encryptedSupplicationPrivateKey, email);
        setMASSaddress(newWallet.address);
        setMASSsupplicationAddress(newSupplicationWallet.address);
    } catch (error) {
        console.error('Error creating MASS wallet:', error);
    }
};

const saveWalletDetails = async (
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
        console.log('Save MASS Response:', data);
    } catch (error) {
        console.error('Error saving wallet details:', error);
    }
};











const createWallets = async () => {
    let btcWalletCreationInvoked = false;
    let massWalletCreationInvoked = false;
  
    try {
      await createBTCwallet();
      btcWalletCreationInvoked = true;
      console.log("BTC wallet creation invoked successfully.");
    } catch (error) {
      console.error("Error invoking BTC wallet creation:", error);
    }
  
    try {
      await createMASSwallet();
      massWalletCreationInvoked = true;
      console.log("MASS wallet creation invoked successfully.");
    } catch (error) {
      console.error("Error invoking MASS wallet creation:", error);
    }
  
    if (!btcWalletCreationInvoked && !massWalletCreationInvoked) {
      console.error("Both BTC and MASS wallet creations failed.");
    } else if (!btcWalletCreationInvoked) {
      console.warn("BTC wallet invocation failed");
    } else if (!massWalletCreationInvoked) {
      console.warn("MASS wallet invocation failed");
    }
  };















  return (
    <SignerContext.Provider
      value={{
        MASSaddress,
        MASSsupplicationAddress,
        bitcoinAddress,
        bitcoinPrivateKey,
        MASSPrivateKey,
        MASSsupplicationPrivateKey,
        email,
        bitcoinBalance,
        balances,
        createWallets,
      }}
    >
        <>
            {showImporting && (
            <div id="selling-failed-wrapper-concept">
            <div id="importing-content">
                <Image 
                    // loader={imageLoader}
                    alt="" 
                    width={25}
                    height={25}
                    id="selling-image-concept-bit" 
                    src="/images/market/bitcoin-loader.png"
                    /> 
                    <div className={stylings.marketplaceloader}> 
                    </div>
                <p id="importing-words">creating importer</p>
            </div>
            </div>
        )}
        </>
      {children}
    </SignerContext.Provider>
  );
};

export const useSigner = () => {
  const context = useContext(SignerContext);
  if (!context) throw new Error("useSigner must be used within a SignerProvider");
  return context;
};