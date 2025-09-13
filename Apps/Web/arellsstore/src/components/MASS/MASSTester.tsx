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

  const [perWalletBalances, setPerWalletBalances] = useState<PerWalletBalances>({});
  const [isCreatingMASS, setIsCreatingMASS] = useState(false);
  const [createMASSError, setCreateMASSError] = useState<string | null>(null);

  async function fetchBalancesForAddress(address: string) {
    const btc = new ethers.Contract(TOKEN_ADDRESSES.BTC_BASE, ERC20_ABI, provider_BASE);
    const usdc = new ethers.Contract(TOKEN_ADDRESSES.USDC_BASE, ERC20_ABI, provider_BASE);
    const [btcBal, usdcBal] = await Promise.all([
      btc.balanceOf(address),
      usdc.balanceOf(address),
    ]);
    return {
      BTC_BASE: ethers.formatUnits(btcBal, 8),
      USDC_BASE: ethers.formatUnits(usdcBal, 6),
    };
  }

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

  const handleCBBTCsupplication = async () => {
    if (!wrappedBitcoinAmount || parseFloat(wrappedBitcoinAmount as string) <= 0) {
      setConversionError('Please enter a valid Bitcoin amount.');
      return;
    }
    if (!MASSaddress) {
      setConversionError('Wallet information is missing.');
      return;
    }
    setConversionError(null);
    setIsConverting(true);
    try {
      await axios.post('/api/MASS_cbbtc', {
        cbBitcoinAmount: parseFloat(wrappedBitcoinAmount as string),
        massAddress: MASSaddress,
        massPrivateKey: MASSPrivateKey,
      });
      setConversionResult('Supplication successful!');
    } catch (error: any) {
      setConversionError(error.response?.data?.error || 'Conversion failed. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleUSDCsupplication = async () => {
    if (!dollarAmount || isNaN(Number(dollarAmount)) || Number(dollarAmount) <= 0) {
      setConversionError('Please enter a valid USDC amount.');
      return;
    }
    if (!MASSPrivateKey || !MASSaddress) {
      setConversionError('Wallet information is missing.');
      return;
    }
    setIsConverting(true);
    setConversionError(null);
    try {
      await axios.post('/api/MASS_usdc', {
        usdcAmount: parseFloat(dollarAmount as string),
        massAddress: MASSaddress,
        massPrivateKey: MASSPrivateKey,
      });
      setConversionResult('Supplication successful!');
    } catch {
      setConversionError('Supplication failed. Please try again.');
    } finally {
      setIsConverting(false);
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
                    value={wrappedBitcoinAmount}
                    onChange={(e) => setWrappedBitcoinAmount(e.target.value)}
                    placeholder="Enter amount in BTC"
                  />
                  <button onClick={handleCBBTCsupplication} disabled={isConverting}>
                    {isConverting ? 'Supplicating...' : 'Supplicate CBBTC to USD'}
                  </button>
                </div>

                <div>
                  <input
                    type="tel"
                    value={dollarAmount}
                    onChange={(e) => setDollarAmount(e.target.value)}
                    placeholder="Enter amount in USD"
                  />
                  <button onClick={handleUSDCsupplication} disabled={isConverting}>
                    {isConverting ? 'Supplicating...' : 'Supplicate USDC to CBBTC'}
                  </button>
                </div>

                {conversionError && <p>{conversionError}</p>}
                {conversionResult && <p>{conversionResult}</p>}
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