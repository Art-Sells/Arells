import { useEffect, useState } from 'react';

const Bitcoin: React.FC = () => {
  const [wallet, setWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [fee, setFee] = useState<number>(10000); // Example fee

  useEffect(() => {
    if (wallet?.address) {
      const fetchBalance = async () => {
        const res = await fetch(`/api/balance?address=${wallet.address}`);
        const data = await res.json();
        setBalance(data.balance);
      };
      fetchBalance();
    }
  }, [wallet]);

  const createWallet = async () => {
    const res = await fetch('/api/wallet');
    const data = await res.json();
    setWallet(data);
  };

  const sendBitcoin = async () => {
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
      <h1>Bitcoin Marketplace</h1>
      <button onClick={createWallet}>Create Wallet</button>
      {wallet && (
        <div>
          <p>Address: {wallet.address}</p>
          <p>Private Key: {wallet.privateKey}</p>
          <p>Balance: {balance ? balance / 1e8 : 'Loading...'} BTC</p>
        </div>
      )}
      <div>
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
    </div>
  );
};

export default Bitcoin;