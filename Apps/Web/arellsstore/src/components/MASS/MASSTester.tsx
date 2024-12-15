'use client';

import React, { useState } from 'react';
import { useSigner } from '../../state/signer'; // Ensure the correct path
import CryptoJS from "crypto-js";

const MASSTester: React.FC = () => {
  const {
    createWallets,
    MASSaddress,
    MASSsupplicationAddress,
    bitcoinAddress,
    bitcoinPrivateKey,
    MASSPrivateKey,
    MASSsupplicationPrivateKey,
    balances,
    email,
    bitcoinBalance,
  } = useSigner();

  const formatBalance = (balance: number | null) =>
    balance !== null ? balance.toFixed(8) : "Loading...";

  return (
    <div>
      <h2>MASS Wallet Tester</h2>
      <p>Email: {email}</p>
      <hr />
      <h3>Bitcoin Details</h3>
      <p>Bitcoin Address: {bitcoinAddress}</p>
      <p>Bitcoin Private Key:</p>
      <pre>{bitcoinPrivateKey || "Not Available"}</pre> {/* Full key displayed securely */}
      <p>Bitcoin Balance: {formatBalance(bitcoinBalance)} BTC</p>

      <hr />
      <button onClick={createWallets}>Create Wallets</button>
      <h3>MASS Wallet Details</h3>
      <p>MASS Address: {MASSaddress || "Not Available"}</p>
      <p>MASS Private Key:</p>
      <pre>{MASSPrivateKey || "Not Available"}</pre> {/* Full decrypted key displayed */}
      <p>MASS Supplication Address: {MASSsupplicationAddress || "Not Available"}</p>
      <p>MASS Supplication Private Key:</p>
      <pre>{MASSsupplicationPrivateKey || "Not Available"}</pre> {/* Full decrypted key displayed */}
      <h3>Balances</h3>
      <p>MASS Balances:</p>
      <p>WBTC: {balances.WBTC}</p>
      <p>POL: {balances.POL_MASS}</p>
      <p>MASS Supplication Balances:</p>
      <p>USDC: {balances.USDC}</p>
      <p>POL: {balances.POL_SUPPLICATION}</p>
    </div>
  );
};

export default MASSTester;