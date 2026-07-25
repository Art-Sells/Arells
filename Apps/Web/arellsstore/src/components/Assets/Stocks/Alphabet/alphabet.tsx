'use client';

import React from 'react';
import VavityAlphabet from './VavityAlphabet';

type AlphabetWrapProps = {
  sessionMountClearGuardRef: React.MutableRefObject<boolean>;
};

const Alphabet: React.FC<AlphabetWrapProps> = ({ sessionMountClearGuardRef }) => {
  return <VavityAlphabet sessionMountClearGuardRef={sessionMountClearGuardRef} />;
};

export default Alphabet;
