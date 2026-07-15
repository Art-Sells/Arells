'use client';

import React from 'react';
import VavitySpaceX from './VavitySpaceX';

type SpaceXWrapProps = {
  sessionMountClearGuardRef: React.MutableRefObject<boolean>;
};

const SpaceX: React.FC<SpaceXWrapProps> = ({ sessionMountClearGuardRef }) => {
  return <VavitySpaceX sessionMountClearGuardRef={sessionMountClearGuardRef} />;
};

export default SpaceX;
