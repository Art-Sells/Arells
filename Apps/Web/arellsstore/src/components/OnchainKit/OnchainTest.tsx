'use client';

import React from 'react';
import {
  Swap,
  SwapAmountInput,
  SwapToggleButton,
  SwapButton,
  SwapMessage,
  SwapToast,
} from '@coinbase/onchainkit/swap';
import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';
import { Avatar, Name } from '@coinbase/onchainkit/identity';
import { setOnchainKitConfig } from '@coinbase/onchainkit';
import { useAccount } from 'wagmi';
import type { Address } from 'viem'

// Define the Token type manually
type Token = {
    address: Address | ''; // The address of the token contract, this value will be empty for native ETH
    chainId: number; // The chain id of the token contract
    decimals: number; // The number of token decimals
    image: string | null; // A string url of the token logo
    name: string;
    symbol: string; 
};

// Configure OnchainKit with your API key
setOnchainKitConfig({ apiKey: 'YOUR_API_KEY' });

const OnchainSwap: React.FC = () => {
  const { address } = useAccount();

  // Define tokens for swapping
  const ETHToken: Token = {
    name: 'Ethereum',
    address: '',
    symbol: 'ETH',
    decimals: 18,
    image:
      'https://wallet-api-production.s3.amazonaws.com/uploads/tokens/eth_288.png',
    chainId: 8453,
  };

  const USDCToken: Token = {
    name: 'USDC',
    address: '0x833589fcd6eDb6E08f4c7C32D4f71b54bda02913',
    symbol: 'USDC',
    decimals: 6,
    image:
      'https://dynamic-assets.coinbase.com/3c15df5e2ac7d4abbe9499ed9335041f00c620f28e8de2f93474a9f432058742cdf4674bd43f309e69778a26969372310135be97eb183d91c492154176d455b8/asset_icons/9d67b728b6c8f457717154b3a35f9ddc702eae7e76c4684ee39302c4d7fd0bb8.png',
    chainId: 8453,
  };

  const swappableTokens: Token[] = [ETHToken, USDCToken];

  return (
    <div style={{ padding: '20px' }}>
      <h2>Onchain Swap</h2>
      {address ? (
        <Swap>
          {/* Input for the token being sold */}
          <SwapAmountInput
            label="Sell"
            swappableTokens={swappableTokens}
            token={ETHToken}
            type="from"
          />

          {/* Toggle button for switching tokens */}
          <SwapToggleButton />

          {/* Input for the token being bought */}
          <SwapAmountInput
            label="Buy"
            swappableTokens={swappableTokens}
            token={USDCToken}
            type="to"
          />

          {/* Swap execution button */}
          <SwapButton />

          {/* Feedback messages */}
          <SwapMessage />
          <SwapToast />
        </Swap>
      ) : (
        <Wallet>
          <ConnectWallet>
            <Avatar className="h-6 w-6" />
            <Name />
          </ConnectWallet>
        </Wallet>
      )}
    </div>
  );
};

export default OnchainSwap;