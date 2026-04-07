'use client';

import React from 'react';
import type { ImageLoaderProps } from 'next/image';
import Image from 'next/image';

const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
  return `/${src}?w=${width}&q=${quality || 100}`;
};

/** Below the auth card when success collapse starts; fades in over 2s (see Home.css). */
const AuthSuccessArellsMark: React.FC = () => {
  return (
    <div className="auth-success-arells-mark" aria-hidden="true">
      <span className="home-loader-icon-wrap auth-success-arells-icon-wrap">
        <span className="home-loader-icon-tint" aria-hidden="true" />
        <Image
          loader={imageLoader}
          alt=""
          width={49}
          height={50}
          className="home-loader-icon-img"
          src="images/Arells-Icon.png"
        />
      </span>
    </div>
  );
};

export default AuthSuccessArellsMark;
