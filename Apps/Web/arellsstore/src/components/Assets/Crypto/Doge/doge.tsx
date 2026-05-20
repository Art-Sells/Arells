'use client';

import React from 'react';
import VavityDoge from './VavityDoge';

type DogeWrapProps = {
  sessionMountClearGuardRef: React.MutableRefObject<boolean>;
};

const Doge: React.FC<DogeWrapProps> = ({ sessionMountClearGuardRef }) => {
  return <VavityDoge sessionMountClearGuardRef={sessionMountClearGuardRef} />;
};

export default Doge;
