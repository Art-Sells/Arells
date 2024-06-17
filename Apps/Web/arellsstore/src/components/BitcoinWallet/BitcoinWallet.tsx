'use client';

import '../../app/css/bitcoin/BitcoinWalletCreated.css';
import '../../app/css/modals/bitcoin/bitcoinwalletcreated-modal.css';

import { useEffect, useState } from 'react';

const BitcoinWalletCreated: React.FC = () => {
  const [createdWallet, setCreatedWallet] = useState<{ address: string; privateKey: string } | null>(null);

  const createWallet = async () => {
    const res = await fetch('/api/wallet');
    const data = await res.json();
    setCreatedWallet(data);
  };

  useEffect(() => {
    createWallet();
  }, []); // Empty dependency array means this will only run once when the component mounts

  return (
    <div>
      {createdWallet ? (
        <div>
          <h1 id="bitcoinwalletcreated-title">Bitcoin Wallet Created</h1>
          <p>Address: {createdWallet.address}</p>
          <p>Private Key: {createdWallet.privateKey}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default BitcoinWalletCreated;