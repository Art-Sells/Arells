'use client';

import React from 'react';

type GuestLandingCopyrightProps = {
  variant: 'home' | 'asset';
  cssModifier?: string;
  className?: string;
};

export default function GuestLandingCopyright({ variant, cssModifier, className }: GuestLandingCopyrightProps) {
  const baseClassName =
    variant === 'home'
      ? 'guest-landing-copyright guest-landing-copyright--home'
      : `guest-landing-copyright guest-landing-copyright--asset guest-landing-copyright--${cssModifier ?? ''}`;

  return <p className={className ? `${baseClassName} ${className}` : baseClassName}>© Arells, Inc</p>;
}
