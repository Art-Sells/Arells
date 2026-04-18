'use client';

import React from 'react';
import VavityBitcoin from './VavityBitcoin';

type BitcoinProps = {
  sessionMountClearGuardRef: React.MutableRefObject<boolean>;
};

const Bitcoin: React.FC<BitcoinProps> = ({ sessionMountClearGuardRef }) => {
  return <VavityBitcoin sessionMountClearGuardRef={sessionMountClearGuardRef} />;
};

export default Bitcoin;
