'use client';

import React, {
  createContext, useContext, useState, useEffect, ReactNode, useCallback
} from "react";
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

// ERC20 for USDC transfers
const ERC20_ABI_X = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

const usdcWith = (signerOrProvider: ethers.Signer | ethers.Provider) =>
  new ethers.Contract(TOKEN_ADDRESSES.USDC_BASE, ERC20_ABI_X, signerOrProvider);

interface SignerContextType {
  userAddress: string;
  userPrivateKey: string;
  email: string;
  balances: {
    BTC_BASE: string;
    USDC_BASE: string;
  };
  connectWallet: (emailOverride?: string) => Promise<void>; 
  userBalances: { BTC_BASE: string; USDC_BASE: string };
  loadBalances: (address: string) => Promise<{ BTC_BASE: string; USDC_BASE: string }>;
  refreshUserBalances: () => Promise<void>;
}

const SignerContext = createContext<SignerContextType | undefined>(undefined);

export const SignerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userAddress, setUserAddress] = useState<string>("");
  const [userPrivateKey, setUserPrivateKey] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [balances, setBalances] = useState({
    BTC_BASE: "0",
    USDC_BASE: "0",
  });
  const [userBalances, setUserBalances] = useState({ BTC_BASE: "0", USDC_BASE: "0" });

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




















    //User Wallet functions:


  const checkUserWalletExists = async (emailOverride?: string): Promise<boolean> => {
    const effectiveEmail = emailOverride ?? email;
    if (!effectiveEmail) {
      console.warn('Email is not set. Cannot check User Wallet file existence.');
      return false;
    }

    try {
      await axios.get(`/api/readUserWallet`, { params: { email: effectiveEmail } });
      console.log('User Wallet exists');
      return true;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        console.log('User Wallet does not exist.');
        return false;
      }
      console.error('Error checking User Wallet file existence:', error);
      throw error;
    }
  };

  const createUserWallet = async (emailOverride?: string) => {
    try {
      const effectiveEmail = emailOverride ?? email;
      if (!effectiveEmail) {
        console.warn('No email available for wallet creation.');
        return;
      }

      const fileExists = await checkUserWalletExists(effectiveEmail);
      if (fileExists) {
        console.log('Skipping User Wallet creation.');
        return;
      }

      const newWallet = ethers.Wallet.createRandom();
      const encryptedPrivateKey = CryptoJS.AES.encrypt(
        newWallet.privateKey,
        'your-secret-key'
      ).toString();

      await saveUserWalletDetails(newWallet.address, encryptedPrivateKey, effectiveEmail);
      setUserAddress(newWallet.address);
    } catch (error) {
      console.error('Error creating User Wallet:', error);
    }
  };

  const saveUserWalletDetails = async (
    userAddress: string,
    userKey: string,
    emailParam: string
  ) => {
    try {
      await fetch('/api/saveUserWallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress, userKey, email: emailParam }),
      });
      console.log('User Wallet saved');
    } catch (error) {
      console.error('Error saving User Wallet details:', error);
    }
  };
















































  // User Wallet functions:
  const connectWallet = async (emailOverride?: string) => {
    try {
      await createUserWallet(emailOverride);
    } catch (error) {
      console.error('Error connecting User Wallet:', error);
    }
  };




  const loadBalances = useCallback(async (address: string) => {
    if (!address) return { BTC_BASE: "0", USDC_BASE: "0" };

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

      const [btc, usdc] = await Promise.all([
        BTCContract_BASE.balanceOf(address),
        USDCContract_BASE.balanceOf(address),
      ]);

      return {
        BTC_BASE: ethers.formatUnits(btc, 8),
        USDC_BASE: ethers.formatUnits(usdc, 6),
      };
    } catch (error) {
      console.error("Error fetching balances for", address, error);
      return { BTC_BASE: "0", USDC_BASE: "0" };
    }
  }, []);

  // updates the *user* balances state
  const refreshUserBalances = async () => {
    if (!userAddress) return;
    const b = await loadBalances(userAddress);
    setUserBalances(b); // <- you'll need userBalances state (see below)
  };


  useEffect(() => {
    if (!email) return;

    let cancelled = false;
    let timer: NodeJS.Timeout | null = null;
    let inFlight = false;

    const fetchWalletDetails = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;

      try {
        const userResp = await axios.get('/api/readUserWallet', { params: { email } }).catch(() => null);

        if (userResp?.data) {
          const u = userResp.data;
          setUserAddress(u.userAddress || '');
          if (u.userKey) {
            setUserPrivateKey(
              CryptoJS.AES.decrypt(u.userKey, 'your-secret-key').toString(CryptoJS.enc.Utf8)
            );
          }
        }

      } catch (err) {
        console.error('[poll] fetchWalletDetails failed:', err);
      } finally {
        inFlight = false;
        if (!cancelled) {
          timer = setTimeout(fetchWalletDetails, 5000); // schedule next tick
        }
      }
    };

    // kick off immediately
    fetchWalletDetails();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [email]); 

  useEffect(() => {
    if (!userAddress) return;
    let cancelled = false, t: ReturnType<typeof setTimeout> | null = null;
    const tick = async () => {
      try { await refreshUserBalances(); } finally {
        if (!cancelled) t = setTimeout(tick, 5000);
      }
    };
    tick();
    return () => { cancelled = true; if (t) clearTimeout(t); };
  }, [userAddress]);


  return (
    <SignerContext.Provider
      value={{
        userAddress,
        userPrivateKey,
        email,
        balances,
        connectWallet,
        userBalances,
        loadBalances,
        refreshUserBalances,
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