'use client';

import React from 'react';
import VavityCardano from './VavityCardano';

type CardanoWrapProps = {
  sessionMountClearGuardRef: React.MutableRefObject<boolean>;
};

const Cardano: React.FC<CardanoWrapProps> = ({ sessionMountClearGuardRef }) => {
  return <VavityCardano sessionMountClearGuardRef={sessionMountClearGuardRef} />;
};

export default Cardano;
