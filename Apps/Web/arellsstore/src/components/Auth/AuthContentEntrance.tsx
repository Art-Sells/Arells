'use client';

import React, { useEffect, useState } from 'react';

/**
 * Plays the same slide-up entrance as the auth shell when this block mounts (e.g. after a loader).
 */
const AuthContentEntrance: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setOn(true), 50);
    return () => window.clearTimeout(t);
  }, []);
  return <div className={on ? 'auth-content-slide-in' : ''}>{children}</div>;
};

export default AuthContentEntrance;
