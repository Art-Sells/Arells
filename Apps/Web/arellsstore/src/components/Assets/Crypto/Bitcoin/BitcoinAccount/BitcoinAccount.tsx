import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import { useBitcoinPrice } from '../../../../../context/Assets/Crypto/Bitcoin/BitcoinPriceContext';
import '../../../../../app/css/bitcoin-account/BitcoinAccount.css';
import '../../../../../app/css/modals/bitcoin-account/bitcoin-account-modal.css';

const bitcoinLoader = ({ src, width, quality }: ImageLoaderProps): string => {
  return `https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/${src}?w=${width}&q=${quality || 100}`;
};

const BitcoinAccount: React.FC = () => {
  const { bitcoinPrice } = useBitcoinPrice();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div id="account-wrapper">
      <div id="account-container">
        <div className="header-container">
          <div className="h1">Bitcoin</div>
          <div className="sub-header">Buying/selling/holding</div>
          <button id="withdaw" aria-label="Withdraw">
            Withdraw
          </button>
          <button id="deposit" aria-label="Deposit">
            Deposit
          </button>
        </div>

        <div className="btc" id="btc">
          <div className="btc-container">
            <div className="btc-header">
              <p id="balance">Balance</p>
              <p id="usd">$100,000.98</p>
              <p className="deposits">Deposits: $0.00</p>
              <p className="liquidation">Liquidation: $0.00</p>
            </div>

            <div className="btc-price-container">
              <div className="btc-price">
                <div className="btc-logo">
      <Image
                    loader={bitcoinLoader}
                    src="bitcoin/bitcoin-256.png"
                    alt="Bitcoin"
                    width={150}
                    height={150}
                    unoptimized
                    priority
                  />
                </div>
                <div className="btc-info">
                  <div className="btc-title">Bitcoin</div>
                  <div className="btc-ticker">BTC</div>
                  <div className="btc-current-price">
                    {isClient ? `$${bitcoinPrice?.toLocaleString('en-US', { maximumFractionDigits: 2 }) ?? '0.00'}` : '$0.00'}
                  </div>
                </div>
                <div className="btc-change">
                  <p id="change">+8.99 (1.35%)</p>
                </div>
              </div>
            </div>

            <div className="btc-chart">
              {/* Chart panel was previously here; left as placeholder */}
              <div style={{ padding: '12px', border: '1px dashed #333', borderRadius: '8px', color: '#fff' }}>
                Bitcoin chart panel unavailable.
              </div>
            </div>
        </div>
        </div>
      </div>
      </div>
  );
};

export default BitcoinAccount;
