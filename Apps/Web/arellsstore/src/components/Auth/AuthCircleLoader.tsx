'use client';

import React from 'react';

type AuthCircleLoaderProps = {
  mounted: boolean;
  visible: boolean;
};

export default function AuthCircleLoader({ mounted, visible }: AuthCircleLoaderProps) {
  if (!mounted) return null;

  return (
    <div className={`auth-circle-loader${visible ? ' is-visible' : ''}`} aria-hidden="true">
      <div className="auth-circle-loader-ring" />
    </div>
  );
}
