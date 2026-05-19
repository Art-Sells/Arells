'use client';

import React from 'react';
import VavityTron from './VavityTron';

type TronWrapProps = {
  sessionMountClearGuardRef: React.MutableRefObject<boolean>;
};

const Tron: React.FC<TronWrapProps> = ({ sessionMountClearGuardRef }) => {
  return <VavityTron sessionMountClearGuardRef={sessionMountClearGuardRef} />;
};

export default Tron;
