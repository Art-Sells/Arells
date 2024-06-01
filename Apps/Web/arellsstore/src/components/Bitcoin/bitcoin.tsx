'use client';

import { useEffect, useState } from 'react';

const Bitcoin: React.FC = () => {
  const [createdWallet, setCreatedWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [loadedWallet, setLoadedWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [fee, setFee] = useState<number>(10000);
  const [address, setAddress] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');

  useEffect(() => {
    const walletAddress = createdWallet?.address || loadedWallet?.address;
    if (walletAddress) {
      const fetchBalance = async () => {
        const res = await fetch(`/api/balance?address=${walletAddress}`);
        const data = await res.json();
        setBalance(data.balance);
      };
      fetchBalance();
    }
  }, [createdWallet, loadedWallet]);

  const createWallet = async () => {
    const res = await fetch('/api/wallet');
    const data = await res.json();
    setCreatedWallet(data);
    setLoadedWallet(null); // Clear loaded wallet if any
  };

  const loadWallet = async () => {
    const res = await fetch('/api/load-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, privateKey }),
    });
    const data = await res.json();
    if (res.ok) {
      setLoadedWallet(data);
      setCreatedWallet(null); // Clear created wallet if any
    } else {
      alert(data.error);
    }
  };

  const sendBitcoin = async () => {
    const wallet = createdWallet || loadedWallet;
    if (!wallet) return;
    const res = await fetch('/api/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderPrivateKey: wallet.privateKey,
        recipientAddress,
        amount,
        fee,
      }),
    });
    if (res.ok) {
      alert('Transaction sent successfully!');
    }
  };

  return (
    <div>
      <h1>Bitcoin Testnet Marketplace</h1>
      <button onClick={createWallet}>Create Testnet Wallet</button>
      {createdWallet && (
        <div>
          <h2>Created Wallet</h2>
          <p>Address: {createdWallet.address}</p>
          <p>Private Key: {createdWallet.privateKey}</p>
          <p>Balance: {balance !== null ? balance : 'Loading...'} BTC</p>
        </div>
      )}
      <div>
        <h2>Send Testnet Bitcoin</h2>
        <input
          type="text"
          placeholder="Recipient Address"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
        />
        <input
          type="number"
          placeholder="Amount in Satoshis"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <button onClick={sendBitcoin}>Send Bitcoin</button>
      </div>
      <div>
        <h2>Access Existing Testnet Wallet</h2>
        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <input
          type="text"
          placeholder="Private Key"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
        />
        <button onClick={loadWallet}>Load Wallet</button>
      </div>
      {loadedWallet && (
        <div>
          <h2>Loaded Wallet</h2>
          <p>Address: {loadedWallet.address}</p>
          <p>Private Key: {loadedWallet.privateKey}</p>
          <p>Balance: {balance !== null ? balance : 'Loading...'} BTC</p>
        </div>
      )}
    </div>
  );
};

export default Bitcoin;