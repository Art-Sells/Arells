'use client';

import React from 'react';
import VavityBnb from './VavityBnb';

type BnbWrapProps = {
  sessionMountClearGuardRef: React.MutableRefObject<boolean>;
};

const Bnb: React.FC<BnbWrapProps> = ({ sessionMountClearGuardRef }) => {
  return <VavityBnb sessionMountClearGuardRef={sessionMountClearGuardRef} />;
};

export default Bnb;
