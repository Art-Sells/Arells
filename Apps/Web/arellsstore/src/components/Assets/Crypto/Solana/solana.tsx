'use client';

import React from 'react';
import VavitySolana from './VavitySolana';

type BitcoinProps = {
  sessionMountClearGuardRef: React.MutableRefObject<boolean>;
};

const Solana: React.FC<BitcoinProps> = ({ sessionMountClearGuardRef }) => {
  return <VavitySolana sessionMountClearGuardRef={sessionMountClearGuardRef} />;
};

export default Solana;
