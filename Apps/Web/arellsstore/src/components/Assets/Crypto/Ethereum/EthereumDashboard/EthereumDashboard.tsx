import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import { useEthereumPrice } from '../../../../../context/Assets/Crypto/Ethereum/EthereumPriceContext';
import '../../../../../app/css/bitcoin-dashboard/BitcoinDashboard.css';
import '../../../../../app/css/modals/bitcoin-dashboard/bitcoin-dashboard-modal.css';

const ethLoader = ({ src, width, quality }: ImageLoaderProps): string => {
  return `https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/${src}?w=${width}&q=${quality || 100}`;
};

const EthereumDashboard: React.FC = () => {
  const { ethereumPrice } = useEthereumPrice();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div id="account-wrapper">
      <div id="account-container">
        <div className="header-container">
          <div className="h1">Ethereum</div>
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
                    loader={ethLoader}
                    src="ethereum/eth-logo.png"
                    alt="Ethereum"
                    width={150}
                    height={150}
                    unoptimized
                    priority
                  />
                </div>
                <div className="btc-info">
                  <div className="btc-title">Ethereum</div>
                  <div className="btc-ticker">ETH</div>
                  <div className="btc-current-price">
                    {isClient ? `$${ethereumPrice?.toLocaleString('en-US', { maximumFractionDigits: 2 }) ?? '0.00'}` : '$0.00'}
                  </div>
                </div>
                <div className="btc-change">
                  <p id="change">+0.00 (0.00%)</p>
                </div>
              </div>
            </div>

            <div className="btc-chart">
              {/* Chart panel placeholder */}
              <div style={{ padding: '12px', border: '1px dashed #333', borderRadius: '8px', color: '#fff' }}>
                Ethereum chart panel unavailable.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EthereumDashboard;
