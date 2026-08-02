'use client';

import React from 'react';
import VavityMicrosoft from './VavityMicrosoft';

type MicrosoftWrapProps = {
  sessionMountClearGuardRef: React.MutableRefObject<boolean>;
};

const Microsoft: React.FC<MicrosoftWrapProps> = ({ sessionMountClearGuardRef }) => {
  return <VavityMicrosoft sessionMountClearGuardRef={sessionMountClearGuardRef} />;
};

export default Microsoft;
