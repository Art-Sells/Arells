'use client';

import React from 'react';
import VavityNvidia from './VavityNvidia';

type NvidiaWrapProps = {
  sessionMountClearGuardRef: React.MutableRefObject<boolean>;
};

const Nvidia: React.FC<NvidiaWrapProps> = ({ sessionMountClearGuardRef }) => {
  return <VavityNvidia sessionMountClearGuardRef={sessionMountClearGuardRef} />;
};

export default Nvidia;
