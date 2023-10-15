import React, {useState} from "react";

import useSigner from "../../../../state/signer";
import { useFormikContext } from "formik";

// Change below link after test
import '../../../../app/css/modals/connect-wallet.css';

import Image from 'next/image';

const SubmitButton = () => {
	const imageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }): string => {
	  return `/${src}?w=${width}&q=${quality || 100}`;
	};

  const { isSubmitting, submitForm } = useFormikContext();
	const { address, loadingWallet, connectMetamask} = useSigner();
  const [showConnectWallet, setShowConnectWallet] = useState(false);

  // Connect Wallet function
  const connectWalletFunction = async () => {
    connectMetamask();
    setShowConnectWallet(false);
  };

  const handleCreateArt = () => {
    if (!address) {
      setShowConnectWallet(true);
    } else {
      submitForm();
    }
  };

  return (
    <>
      {showConnectWallet && (
        <div id="connectWalletBuy">
          <div className="connect-wallet-content">
            <p id="connect-wallet-words">CONNECT WALLET</p>
            <button id="connectWallet"
              onClick={connectWalletFunction}
              disabled={loadingWallet}>
              <Image 
                loader={imageLoader}
                id="wallet-icon"
                alt=""
                width={50}
                height={50}  
                src="images/prototype/coinbase-wallet-logo.png"/>
            </button>
          </div>
        </div>
      )}
      <button 
          type="button"
          id="post-created-art"
          data-loading={isSubmitting} 
          onClick={handleCreateArt}>
        CREATE ART
      </button>
    </>
  );
};

export default SubmitButton;
