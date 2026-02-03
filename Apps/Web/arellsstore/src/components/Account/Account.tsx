'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import { useBitcoinPrice } from '../../context/BitcoinPriceContext';
import BitcoinChartAccount from '../../components/Assets/Bitcoin/BitcoinChartAccount';
import '../../app/css/account/Account.css';
import '../../app/css/modals/account/account-modal.css';
import '../../app/css/modals/loader/accountloaderbackground.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';
import { signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { useVavity } from '../../context/VavityAggregator';

const Account: React.FC = () => {
  const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
    return `/${src}?w=${width}&q=${quality || 100}`;
  };

  const { vavityPrice, totals } = useVavity();
  const bitcoinPrice = useBitcoinPrice();
  const formattedPrice = bitcoinPrice ? Math.round(bitcoinPrice).toLocaleString('en-US') : '...';

  const [showLoading, setLoading] = useState<boolean>(true);
  const [imagesLoaded, setImagesLoaded] = useState<{ [key: string]: boolean }>({
    accountLogo: false,
  });

  const router = useRouter();

  const handleImageLoaded = (imageName: string) => {
    setImagesLoaded((prevState) => ({
      ...prevState,
      [imageName]: true,
    }));
  };

  useEffect(() => {
    if (Object.values(imagesLoaded).every(Boolean)) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [imagesLoaded]);

  const handleSignOut = async () => {
      try {
      await signOut();
      router.push('/');
      } catch (error) {
          console.log('Error signing out:', error);
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
            id="arells-loader-icon-account"
            src="images/Arells-Icon.png"
          />
          <div id={styles.accountloader}></div>
        </div>
      )}

      <Image
        loader={imageLoader}
        onLoad={() => handleImageLoaded('accountLogo')}
        alt=""
        width={50}
        height={16}
        id="word-logo-account"
        src="images/Arells-Logo-Ebony.png"
      />

      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '12px' }}>Bitcoin Price: ${formattedPrice}</div>
        <div style={{ marginBottom: '12px' }}>
          VAPA (Bitcoin): ${
            vavityPrice ? vavityPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'
          }
        </div>
        <div style={{ marginBottom: '24px' }}>
          Total BTC: {totals?.acVactTaa?.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 }) || '0.00000000'}
        </div>

        <BitcoinChartAccount />

        <div style={{ marginTop: '24px' }}>
          <button id="signout-account" onClick={handleSignOut}>
            Sign out
          </button>
      </div>
      </div>
    </>
  );
};

export default Account;
