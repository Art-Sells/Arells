'use client';

import React from 'react';
import VavityAmazon from './VavityAmazon';

type AmazonWrapProps = {
  sessionMountClearGuardRef: React.MutableRefObject<boolean>;
};

const Amazon: React.FC<AmazonWrapProps> = ({ sessionMountClearGuardRef }) => {
  return <VavityAmazon sessionMountClearGuardRef={sessionMountClearGuardRef} />;
};

export default Amazon;
