'use client';

import React from 'react';
import VavityTesterEthereum from '../../components/Vavity/Assets/Crypto/Ethereum/VavityTesterEthereum';

const VavityTesterEthereumPage = () => {
  return (
    <>
      <style jsx global>{`
        body {
          background-color: #000000 !important;
          color: #ffffff !important;
        }
        #connect-wrapper {
          background-color: #000000 !important;
          color: #ffffff !important;
        }
        #connect-wrapper * {
          color: #ffffff !important;
        }
        #connect-wrapper button {
          color: #ffffff !important;
        }
        #connect-wrapper input {
          background-color: #1a1a1a !important;
          color: #ffffff !important;
          border-color: #333333 !important;
        }
        #connect-wrapper select {
          background-color: #1a1a1a !important;
          color: #ffffff !important;
          border-color: #333333 !important;
        }
      `}</style>
      <div id="connect-wrapper" style={{ backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh' }}>
        <VavityTesterEthereum />
      </div>
    </>
  );
};

export default VavityTesterEthereumPage;
