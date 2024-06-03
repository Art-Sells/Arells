'use client';

import { useEffect, useState } from 'react';

const Bitcoin: React.FC = () => {
  const [createdWallet, setCreatedWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [loadedWallet, setLoadedWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [amount, setAmount] = useState<number>(0); // amount in satoshis
  const stableFee = 0.00006 * 100000000; // 0.00006 BTC in satoshis
  const [address, setAddress] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');

  useEffect(() => {
    const walletAddress = loadedWallet?.address;
    if (walletAddress) {
      const fetchBalance = async () => {
        try {
          const res = await fetch(`/api/balance?address=${walletAddress}`);
          if (!res.ok) {
            throw new Error(`Failed to fetch balance: ${res.statusText}`);
          }
          const data = await res.json();
          console.log('Fetched balance:', data);
          setBalance(data);
        } catch (error) {
          console.error('Error fetching balance:', error);
          setBalance(null);
        }
      };
      fetchBalance();
    }
  }, [loadedWallet]);

  const createWallet = async () => {
    try {
      const res = await fetch('/api/wallet');
      const data = await res.json();
      setCreatedWallet(data);
      setLoadedWallet(null); // Clear loaded wallet if any
    } catch (error) {
      console.error('Error creating wallet:', error);
    }
  };

  const loadWallet = async () => {
    try {
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
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  const sendBitcoin = async () => {
    if (!loadedWallet) {
      alert('Please load a wallet to send Bitcoin.');
      return;
    }

    const totalAmount = amount + stableFee;
    if (balance === null || totalAmount > balance) {
      alert('Insufficient balance to cover the amount and the fee.');
      return;
    }

    console.log("Sending with the following data:");
    console.log("Private Key:", loadedWallet.privateKey);
    console.log("Recipient Address:", recipientAddress);
    console.log("Amount:", amount);
    console.log("Fee:", stableFee);

    try {
      const res = await fetch('/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderPrivateKey: loadedWallet.privateKey,
          recipientAddress,
          amount: Math.round(amount),
          fee: Math.round(stableFee),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Transaction sent successfully! TX ID: ${data.txId}`);
      } else {
        console.error("Response data on error:", data);
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error in sending transaction:", error);
      alert('An unknown error occurred');
    }
  };

  const formatBalance = (balanceInSatoshis: number | null) => {
    if (balanceInSatoshis === null) return 'Loading...';
    if (balanceInSatoshis === 0) return '0';
    const balanceInBTC = balanceInSatoshis / 100000000;
    return balanceInBTC.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
  };

  const formatFee = (feeInSatoshis: number) => {
    const feeInBTC = feeInSatoshis / 100000000;
    return feeInBTC.toFixed(8).replace(/\.?0+$/, '');
  };

  return (
    <div>
      <h1>Bitcoin Marketplace</h1>
      <button onClick={createWallet}>Create Bitcoin Wallet</button>
      {createdWallet && (
        <div>
          <h2>Created Wallet</h2>
          <p>Address: {createdWallet.address}</p>
          <p>Private Key: {createdWallet.privateKey}</p>
          <p>Balance: {balance !== null ? formatBalance(balance) : 'Loading...'} BTC</p>
        </div>
      )}
      <div>
        <h2>Access Existing Bitcoin Wallet</h2>
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
          <p>Balance: {balance !== null ? formatBalance(balance) : 'Loading...'} BTC</p>
          <div>
            <h2>Send Bitcoin</h2>
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
            <p>Network Fee: {formatFee(stableFee)} BTC</p>
            <button onClick={sendBitcoin}>Send Bitcoin</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bitcoin;