'use client';

import React from 'react';
import VavityStellar from './VavityStellar';

type StellarProps = {
  sessionMountClearGuardRef: React.MutableRefObject<boolean>;
};

const Stellar: React.FC<StellarProps> = ({ sessionMountClearGuardRef }) => {
  return <VavityStellar sessionMountClearGuardRef={sessionMountClearGuardRef} />;
};

export default Stellar;
