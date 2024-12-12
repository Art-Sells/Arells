import React, { useState, useEffect } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import CryptoJS from 'crypto-js';
import { useSigner } from '../../state/signer'; // Ensure correct path

const MASSTester: React.FC = () => {
  const { createMASSwallet, address } = useSigner();
  const [balance, setBalance] = useState<number | null>(null);
  const [bitcoinAddress, setBitcoinAddress] = useState<string>('');
  const [MASSAddress, setMASSAddress] = useState<string>(''); // Added state for MASSAddress
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const attributesResponse = await fetchUserAttributes();
        const emailAttribute = attributesResponse.email;
        const bitcoinAddressAttribute = attributesResponse['custom:bitcoinAddress'];
        const bitcoinPrivateKeyAttribute = attributesResponse['custom:bitcoinPrivateKey'];
        const MASSAddressAttribute = attributesResponse['custom:MASSAddress']; // Fetching MASSAddress
        const MASSPrivateKeyAttribute = attributesResponse['custom:MASSPrivateKey']; // Fetching MASSPrivateKey

        if (emailAttribute) setEmail(emailAttribute);
        if (bitcoinAddressAttribute) setBitcoinAddress(bitcoinAddressAttribute);
        if (MASSAddressAttribute) setMASSAddress(MASSAddressAttribute); // Setting MASSAddress

        // Decryption or other secure handling of private keys would be done here if needed, not stored or logged
      } catch (error) {
        console.error('Error fetching user attributes:', error);
      }
    };

    fetchAttributes();
  }, []);

  useEffect(() => {
    if (bitcoinAddress) {
      const fetchBalance = async () => {
        const res = await fetch(`/api/balance?address=${bitcoinAddress}`);
        const data = await res.json();
        setBalance(data);
      };
      fetchBalance();
    }
  }, [bitcoinAddress]);

  const formatBalance = (balanceInSatoshis: number | null) => {
    if (balanceInSatoshis === null) return 'Loading...';
    return (balanceInSatoshis / 100000000).toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
  };

  return (
    <div>
      <p>Email: {email}</p>
      <p>Bitcoin Address: {bitcoinAddress}</p>
      <p>MASS Address: {MASSAddress}</p> {/* Displaying the MASS address */}
      <p>Balance: {balance !== null ? formatBalance(balance) : 'Loading...'} BTC</p>
      <button onClick={createMASSwallet}>Create MASSwallet</button>
      {address && <p>New MASSwallet Address: {address}</p>}
    </div>
  );
};

export default MASSTester;