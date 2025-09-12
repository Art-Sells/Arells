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

type MassWallet = {
  id: string;
  createdAt: string;
  MASSaddress: string;
  MASSkey: string;
};

interface SignerContextType {
  MASSaddress: string;
  MASSPrivateKey: string;
  userAddress: string;
  massWallets: MassWallet[];
  refreshMassWallets: () => Promise<void>;
  userPrivateKey: string;
  MASSWalletId: string;
  email: string;
  balances: {
    BTC_BASE: string;
    USDC_BASE: string;
  };
  createWallet: (emailOverride?: string) => Promise<void>; 
  createMASSWallets: () => Promise<void>;
  loadBalances: () => Promise<void>;
  initiateMASS: (usdcAmount: number | string) => Promise<{ txHash: string; massId: string; massAddress: string }>;
}

const SignerContext = createContext<SignerContextType | undefined>(undefined);

export const SignerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [MASSWalletId, setMASSWalletId] = useState<string>("");
  const [MASSaddress, setMASSaddress] = useState<string>("");
  const [MASSPrivateKey, setMASSPrivateKey] = useState<string>("");
  const [userAddress, setUserAddress] = useState<string>("");
  const [userPrivateKey, setUserPrivateKey] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [massWallets, setMassWallets] = useState<MassWallet[]>([]);
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
























  //MASS wallet functions:
  const createMASSWalletAndReturn = async () => {
    const newWallet = ethers.Wallet.createRandom();
    const encryptedPrivateKey = CryptoJS.AES.encrypt(
      newWallet.privateKey,
      "your-secret-key"
    ).toString();

    const resp = await fetch('/api/saveMASS', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        MASSaddress: newWallet.address,
        MASSkey: encryptedPrivateKey,
        email,
      }),
    });
    const json = await resp.json();

    // keep latest in state
    setMASSaddress(newWallet.address);
    setMASSPrivateKey(newWallet.privateKey);
    if (json?.id) setMASSWalletId(json.id);

    // append to array
    setMassWallets(prev => [
      ...prev,
      {
        id: json?.id ?? crypto.randomUUID?.() ?? `${Date.now()}`,
        createdAt: new Date().toISOString(),
        MASSaddress: newWallet.address,
        MASSkey: encryptedPrivateKey,
      },
    ]);

    return {
      id: json?.id ?? '',
      address: newWallet.address,
      encryptedKey: encryptedPrivateKey,
      plainKey: newWallet.privateKey,
    };
  };

  const initiateMASS = async (usdcAmount: number | string) => {
    // validate input
    const n = Number(usdcAmount);
    if (!n || n <= 0) throw new Error('Invalid USDC amount');

    if (!userPrivateKey || !userAddress) {
      throw new Error('User wallet not available');
    }

    // 1) create MASS & get the fresh address
    const { id: massId, address: massAddress } = await createMASSWalletAndReturn();

    // 2) (optional) read back from S3 to be sure it’s persisted
    try { await refreshMassWallets(); } catch {}

    // 3) transfer USDC from user wallet -> new MASS wallet
    const signer = new ethers.Wallet(userPrivateKey, provider_BASE);
    const usdc = usdcWith(signer);

    // ensure user has enough USDC
    const bal = await usdc.balanceOf(userAddress);
    const amt = ethers.parseUnits(String(usdcAmount), 6); // USDC has 6 decimals
    if (bal < amt) {
      throw new Error(`Insufficient USDC: have ${ethers.formatUnits(bal, 6)}, need ${usdcAmount}`);
    }

    // NOTE: user must have ETH on Base for gas
    const tx = await usdc.transfer(massAddress, amt);
    const receipt = await tx.wait();

    // optionally refresh balances
    try { await loadBalances(); } catch {}

    return { txHash: receipt.hash, massId, massAddress };
  };

  const refreshMassWallets = async () => {
    if (!email) return;
    try {
      const { data } = await axios.get('/api/readMASS', { params: { email } });
      setMassWallets(Array.isArray(data.wallets) ? data.wallets : []);
      if (data?.MASSaddress) setMASSaddress(data.MASSaddress);
      if (data?.id) setMASSWalletId(data.id);
    } catch (e) {
      console.error('refreshMassWallets failed:', e);
    }
  };

  // When creating, append the new wallet locally so UI updates immediately
  const createMASSWallet = async () => {
    try {
      const newWallet = ethers.Wallet.createRandom();
      const encryptedPrivateKey = CryptoJS.AES.encrypt(
        newWallet.privateKey,
        'your-secret-key'
      ).toString();

      const resp = await fetch('/api/saveMASS', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ MASSaddress: newWallet.address, MASSkey: encryptedPrivateKey, email }),
      });
      const json = await resp.json();

      // keep “latest” fields for backwards-compat views
      setMASSaddress(newWallet.address);
      setMASSPrivateKey(newWallet.privateKey);
      if (json?.id) setMASSWalletId(json.id);

      // add to array
      setMassWallets(prev => [
        ...prev,
        {
          id: json?.id ?? crypto.randomUUID?.() ?? `${Date.now()}`,
          createdAt: new Date().toISOString(),
          MASSaddress: newWallet.address,
          MASSkey: encryptedPrivateKey,
        },
      ]);
    } catch (error) {
      console.error('Error creating MASS wallet:', error);
    }
  };
























  // User/MASS Wallet functions:
  const createWallet = async (emailOverride?: string) => {
    try {
      await createUserWallet(emailOverride);
    } catch (error) {
      console.error('Error creating User Wallet:', error);
    }
  };

  const createMASSWallets = async () => {
    try {
      await createMASSWallet();
    } catch (error) {
      console.error("Error creating MASS Wallet/s:", error);
    }
  };




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
    if (!email) return;

    let cancelled = false;
    let timer: NodeJS.Timeout | null = null;
    let inFlight = false;

    const fetchWalletDetails = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;

      try {
        // fetch in parallel
        const [userResp, massResp] = await Promise.all([
          axios.get('/api/readUserWallet', { params: { email } }).catch(() => null),
          axios.get('/api/readMASS', { params: { email } }).catch(() => null),
        ]);

        if (userResp?.data) {
          const u = userResp.data;
          setUserAddress(u.userAddress || '');
          if (u.userKey) {
            setUserPrivateKey(
              CryptoJS.AES.decrypt(u.userKey, 'your-secret-key').toString(CryptoJS.enc.Utf8)
            );
          }
        }

        if (massResp?.data) {
          const m = massResp.data;
          if (m.MASSaddress) setMASSaddress(m.MASSaddress);
          if (m.MASSkey) {
            setMASSPrivateKey(
              CryptoJS.AES.decrypt(m.MASSkey, 'your-secret-key').toString(CryptoJS.enc.Utf8)
            );
          }
          if (Array.isArray(m.wallets)) setMassWallets(m.wallets);
        }

        // optional: balances
        if (MASSaddress) {
          try { await loadBalances(); } catch {}
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
        massWallets,
        refreshMassWallets,
        createWallet,
        createMASSWallets,
        loadBalances,
        initiateMASS
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