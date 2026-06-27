'use client';

import React from 'react';
import VavityBitcoinCash from './VavityBitcoinCash';

type BitcoinCashWrapProps = {
  sessionMountClearGuardRef: React.MutableRefObject<boolean>;
};

const BitcoinCash: React.FC<BitcoinCashWrapProps> = ({ sessionMountClearGuardRef }) => {
  return <VavityBitcoinCash sessionMountClearGuardRef={sessionMountClearGuardRef} />;
};

export default BitcoinCash;
