'use client';

import React from 'react';
import VavityApple from './VavityApple';

type AppleWrapProps = {
  sessionMountClearGuardRef: React.MutableRefObject<boolean>;
};

const Apple: React.FC<AppleWrapProps> = ({ sessionMountClearGuardRef }) => {
  return <VavityApple sessionMountClearGuardRef={sessionMountClearGuardRef} />;
};

export default Apple;
