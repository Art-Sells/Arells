'use client';

import React from 'react';
import VavityEthereum from './VavityEthereum';

type EthereumProps = {
  sessionMountClearGuardRef: React.MutableRefObject<boolean>;
};

const Ethereum: React.FC<EthereumProps> = ({ sessionMountClearGuardRef }) => {
  return <VavityEthereum sessionMountClearGuardRef={sessionMountClearGuardRef} />;
};

export default Ethereum;
