'use client';

import React from 'react';
import VavityXrp from './VavityXrp';

type XrpProps = {
  sessionMountClearGuardRef: React.MutableRefObject<boolean>;
};

const Xrp: React.FC<XrpProps> = ({ sessionMountClearGuardRef }) => {
  return <VavityXrp sessionMountClearGuardRef={sessionMountClearGuardRef} />;
};

export default Xrp;
