// components/MASSTester.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSigner } from '../../state/signer';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { ethers } from 'ethers';

const TOKEN_ADDRESSES = {
  BTC_BASE: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
  USDC_BASE: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

const provider_BASE = new ethers.JsonRpcProvider(
  'https://base-mainnet.infura.io/v3/4885ed01637e4a6f91c2c7fcd1714f68'
);

const ERC20_ABI = ['function balanceOf(address owner) view returns (uint256)'];

type PerWalletBalances = Record<string, { BTC_BASE?: string; USDC_BASE?: string }>;

const MASSTester: React.FC = () => {
  const {
    createMASSWallets,
    refreshMassWallets,
    massWallets,
    userAddress,
    userPrivateKey,
    MASSaddress,
    MASSPrivateKey,
    userBalances,
    email,
    perMassBalances,
    initiateMASS
  } = useSigner();

  const [wrappedBitcoinAmount, setWrappedBitcoinAmount] = useState<number | string>('');
  const [dollarAmount, setDollarAmount] = useState<number | string>('');
  const [conversionResult, setConversionResult] = useState<string | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);

  // Per-wallet inputs
  const [perUsd, setPerUsd] = useState<Record<string, string>>({});
  const [perBtc, setPerBtc] = useState<Record<string, string>>({});

  // Per-wallet UI state
  const [isWorkingById, setIsWorkingById] = useState<Record<string, boolean>>({});
  const [errorById, setErrorById] = useState<Record<string, string | null>>({});
  const [resultById, setResultById] = useState<Record<string, string | null>>({});

  const setUsdFor = (id: string, v: string) =>
  setPerUsd(prev => ({ ...prev, [id]: v }));

  const setBtcFor = (id: string, v: string) =>
    setPerBtc(prev => ({ ...prev, [id]: v }));

  const setWorking = (id: string, v: boolean) =>
    setIsWorkingById(prev => ({ ...prev, [id]: v }));

  const setErr = (id: string, msg: string | null) =>
    setErrorById(prev => ({ ...prev, [id]: msg }));

  const setRes = (id: string, msg: string | null) =>
    setResultById(prev => ({ ...prev, [id]: msg }));

    // const handleCreateMASS = async () => {
    //   setIsCreatingMASS(true);
    //   setCreateMASSError(null);
    //   try {
    //     await createMASSWallets();
    //     if (typeof refreshMassWallets === 'function') {
    //       await refreshMassWallets();
    //     }
    //   } catch (e: any) {
    //     setCreateMASSError(e?.message || 'Failed to create MASS wallet');
    //   } finally {
    //     setIsCreatingMASS(false);
    //   }
    // };

const handleInitiateMASS = async () => {
  try {
    setIsConverting(true);
    setConversionError(null);
    const { txHash, massId, massAddress } = await initiateMASS(); // <- no args
    setConversionResult(`MASS created (${massId}) and USDC sent to ${massAddress}. tx=${txHash}`);
    if (typeof refreshMassWallets === 'function') {
      await refreshMassWallets();
    }
  } catch (e: any) {
    setConversionError(e?.message || 'initiateMASS failed');
  } finally {
    setIsConverting(false);
  }
};

// USDC -> CBBTC for a specific MASS wallet
const supplicateUSDCFor = async (w: { id: string; MASSaddress: string; MASSkey: string }) => {
  const amountStr = perUsd[w.id] ?? "";
  const amount = parseFloat(amountStr);
  if (!amount || amount <= 0) {
    setErr(w.id, "Please enter a valid USDC amount.");
    return;
  }

  // decrypt this wallet's PK
  const massPrivateKey = CryptoJS.AES.decrypt(w.MASSkey, "your-secret-key").toString(CryptoJS.enc.Utf8);

  setWorking(w.id, true);
  setErr(w.id, null);
  setRes(w.id, null);

  try {
    await axios.post("/api/MASS_usdc", {
      usdcAmount: amount,
      massAddress: w.MASSaddress,
      massPrivateKey,
    });

    setRes(w.id, `Supplication successful for ${amount} USDC.`);
  } catch (e: any) {
    setErr(w.id, e?.response?.data?.error || "Supplication failed. Please try again.");
  } finally {
    setWorking(w.id, false);
  }
};

// CBBTC -> USD for a specific MASS wallet
const supplicateCBBTCFor = async (w: { id: string; MASSaddress: string; MASSkey: string }) => {
  const amountStr = perBtc[w.id] ?? "";
  const amount = parseFloat(amountStr);
  if (!amount || amount <= 0) {
    setErr(w.id, "Please enter a valid BTC amount.");
    return;
  }

  const massPrivateKey = CryptoJS.AES.decrypt(w.MASSkey, "your-secret-key").toString(CryptoJS.enc.Utf8);

  setWorking(w.id, true);
  setErr(w.id, null);
  setRes(w.id, null);

  try {
    await axios.post("/api/MASS_cbbtc", {
      cbBitcoinAmount: amount,
      massAddress: w.MASSaddress,
      massPrivateKey,
    });

    setRes(w.id, `Supplication successful for ${amount} BTC.`);
  } catch (e: any) {
    setErr(w.id, e?.response?.data?.error || "Conversion failed. Please try again.");
  } finally {
    setWorking(w.id, false);
  }
};

  return (
    <div>
      <h2>MASS Wallet Tester</h2>
      <p>Email: {email}</p>
      <hr />

      <h3>User Wallet</h3>
      <p>Address: {userAddress || 'Not Available'}</p>
      <p>Private Key: {userPrivateKey || 'Not Available'}</p>
      <p>Balance (USDC/BASE): {userBalances.USDC_BASE} USDC</p>
      <p>Balance (BTC/BASE): {userBalances.BTC_BASE} cbBTC</p>
      <button onClick={handleInitiateMASS} disabled={isConverting}>
        {isConverting ? 'Initiating…' : 'Initiate MASS (send USDC to MASS Wallet)'}
      </button>
      <hr />

      <h3>MASS Wallets</h3>
      {/* <button onClick={handleCreateMASS} disabled={isCreatingMASS}>
        {isCreatingMASS ? 'Creating…' : 'Create MASS Wallet'}
      </button>
      {createMASSError && <p>{createMASSError}</p>}

      <hr /> */}

      {Array.isArray(massWallets) && massWallets.length > 0 ? (
        <ul>
          {massWallets.map((w) => {
            const decryptedPk = CryptoJS.AES.decrypt(
              w.MASSkey,
              'your-secret-key'
            ).toString(CryptoJS.enc.Utf8);
            const b = perMassBalances[w.MASSaddress] || { USDC_BASE: "0", BTC_BASE: "0" };
            return (
              <li key={w.id}>
                <div>ID: {w.id}</div>
                <div>Address: {w.MASSaddress}</div>
                <div>Private Key: {decryptedPk || ''}</div>
                <div>Balance (USDC/BASE): {b.USDC_BASE ?? '0'} USDC</div>
                <div>Balance (BTC/BASE): {b.BTC_BASE ?? '0'} cbBTC</div>
                      {/* Supplication actions below */}
                <div>
                  <input
                    type="tel"
                    value={perBtc[w.id] ?? ""}
                    onChange={(e) => setBtcFor(w.id, e.target.value)}
                    placeholder="Enter amount in BTC"
                  />
                  <button onClick={() => supplicateCBBTCFor(w)} disabled={!!isWorkingById[w.id]}>
                    {isWorkingById[w.id] ? "Supplicating..." : "Supplicate CBBTC to USD"}
                  </button>
                </div>

                <div>
                  <input
                    type="tel"
                    value={perUsd[w.id] ?? ""}
                    onChange={(e) => setUsdFor(w.id, e.target.value)}
                    placeholder="Enter amount in USD"
                  />
                  <button onClick={() => supplicateUSDCFor(w)} disabled={!!isWorkingById[w.id]}>
                    {isWorkingById[w.id] ? "Supplicating..." : "Supplicate USDC to CBBTC"}
                  </button>
                </div>

                {errorById[w.id] && <p>{errorById[w.id]}</p>}
                {resultById[w.id] && <p>{resultById[w.id]}</p>}
                <hr />
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No MASS wallets yet.</p>
      )}

    </div>
  );
};

export default MASSTester;