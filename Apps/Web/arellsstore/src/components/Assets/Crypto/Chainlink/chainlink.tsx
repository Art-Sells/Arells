'use client';

import React from 'react';
import VavityChainlink from './VavityChainlink';

type ChainlinkWrapProps = {
  sessionMountClearGuardRef: React.MutableRefObject<boolean>;
};

const Chainlink: React.FC<ChainlinkWrapProps> = ({ sessionMountClearGuardRef }) => {
  return <VavityChainlink sessionMountClearGuardRef={sessionMountClearGuardRef} />;
};

export default Chainlink;
