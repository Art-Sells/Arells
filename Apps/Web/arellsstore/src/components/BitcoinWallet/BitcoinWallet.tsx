'use client';

import React, { useEffect, useState } from 'react';

import '../../app/css/bitcoin/BitcoinWalletCreated.css';
import '../../app/css/modals/bitcoin/bitcoinwalletcreated-modal.css';

import '../../app/css/modals/loader/accountloaderbackground.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';

import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';

const BitcoinWalletCreated: React.FC = () => {
  const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
    return `/${src}?w=${width}&q=${quality || 100}`;
  };

  const [showLoading, setLoading] = useState<boolean>(true);
  const [createdWallet, setCreatedWallet] = useState<{ address: string; privateKey: string } | null>(null);

  const createWallet = async () => {
    const res = await fetch('/api/wallet');
    const data = await res.json();
    setCreatedWallet(data);
    setLoading(false); // Set loading to false after the wallet has been generated
  };

  useEffect(() => {
    createWallet();
  }, []); // Empty dependency array means this will only run once when the component mounts

  const copyToClipboard = () => {
    if (createdWallet) {
      navigator.clipboard.writeText(createdWallet.privateKey);
      alert('Private Key copied to clipboard');
    }
  };

  return (
    <>
      {showLoading && (
        <div id="accountloaderbackground">
          <Image 
            loader={imageLoader}
            alt="" 
            width={29}
            height={30}
            id="arells-loader-icon-how" 
            src="images/Arells-Icon.png"
          />    
          <div id={styles.accountloader}></div>    
        </div>
      )}
      {createdWallet && (
        <div>
          <h1 id="bitcoinwalletcreated-title">Bitcoin Wallet Created</h1>
          <p>Copy/Save your private key offline, you will need it to export and send your bitcoin, (do not lose it).</p>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>Private Key:</p>
            <input 
              type="text" 
              value={createdWallet.privateKey} 
              readOnly 
              style={{ flexGrow: 1, marginRight: '8px' }}
            />
            <button onClick={copyToClipboard}>Copy</button>
          </div>
          <p>For security reasons, we do not save your private key online so before you hit continue, ensure you have copied and saved it offline.</p>
        </div>

      )}
    </>
  );
};

export default BitcoinWalletCreated;