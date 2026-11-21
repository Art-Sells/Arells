'use client';

import Link from 'next/link';
import React from 'react';

type GuestLandingCopyrightProps = {
  variant: 'home' | 'asset';
  cssModifier?: string;
  className?: string;
};

export default function GuestLandingCopyright({ variant, cssModifier, className }: GuestLandingCopyrightProps) {
  const copyrightClass =
    variant === 'home'
      ? 'guest-landing-copyright guest-landing-copyright--home'
      : `guest-landing-copyright guest-landing-copyright--asset guest-landing-copyright--${cssModifier ?? ''}`;

  if (variant === 'home') {
    return (
      <div
        className={
          className
            ? `guest-landing-footer-stack ${className}`
            : 'guest-landing-footer-stack'
        }
      >
        <span className="guest-landing-footer-rule" aria-hidden="true" />
        <Link href="/privacy" className="auth-forgot-link guest-landing-privacy-link">
          Privacy Policy
        </Link>
        <p className={copyrightClass}>© Arells, Inc</p>
      </div>
    );
  }

  return (
    <p className={className ? `${copyrightClass} ${className}` : copyrightClass}>© Arells, Inc</p>
  );
}
