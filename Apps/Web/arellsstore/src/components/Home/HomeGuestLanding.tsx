'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import GuestLandingCopyright from '../GuestLandingCopyright';

const imageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) =>
  `/${src}?w=${width}&q=${quality || 100}`;

export default function HomeGuestLanding() {
  return (
    <div className="home-guest-landing">
      <div className="home-guest-landing-stack">
        <span className="home-guest-icon-wrap home-guest-mount-slide home-guest-mount-slide--icon" aria-hidden="true">
          <span className="home-guest-icon-tint" aria-hidden="true" />
          <Image
            loader={imageLoader}
            alt=""
            width={60}
            height={60}
            className="home-guest-icon-img"
            src="images/Arells-Icon.png"
            priority
          />
        </span>
        <Image
          loader={imageLoader}
          alt="Arells"
          width={100}
          height={33}
          className="home-guest-logo home-guest-mount-slide home-guest-mount-slide--logo"
          src="images/Arells-Logo-Ebony.png"
          priority
        />
        <p className="home-guest-slogan home-guest-mount-slide home-guest-mount-slide--slogan">
          investments never lose value
        </p>
        <div className="home-guest-signin-shell shadow-border-wrap home-guest-mount-slide home-guest-mount-slide--signin">
          <span className="shadow-border" aria-hidden="true" />
          <div className="home-guest-signin-panel myinv-accent-border">
            <div className="home-guest-signin-inner">
              <p className="home-guest-signin-lead">Sign in to get involved</p>
              <Link
                href="/signin"
                className="auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button home-assets-show-more-button home-guest-signin-button"
              >
                sign in
              </Link>
            </div>
          </div>
        </div>
        <GuestLandingCopyright
          variant="home"
          className="home-guest-mount-slide home-guest-mount-slide--copyright"
        />
      </div>
    </div>
  );
}
