'use client';

import React, { useEffect, useLayoutEffect, useState } from 'react';
import '../../app/css/Home.css';
import '../../app/css/HomeLoaderOverrides.css';

type AuthPageShellProps = {
  children: React.ReactNode;
  title: string;
  belowCard?: React.ReactNode;
};

const AuthPageShell: React.FC<AuthPageShellProps> = ({ children, title, belowCard }) => {
  const [slideIn, setSlideIn] = useState(false);
  useLayoutEffect(() => {
    setSlideIn(true);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prevHtml = document.documentElement.style.getPropertyValue('--app-bg');
    const prevBody = document.body.style.getPropertyValue('--app-bg');
    const bg = 'var(--page-accent-tint)';
    document.documentElement.style.setProperty('--app-bg', bg);
    document.body.style.setProperty('--app-bg', bg);
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    return () => {
      if (prevHtml) document.documentElement.style.setProperty('--app-bg', prevHtml);
      else document.documentElement.style.removeProperty('--app-bg');
      if (prevBody) document.body.style.setProperty('--app-bg', prevBody);
      else document.body.style.removeProperty('--app-bg');
    };
  }, []);

  return (
    <div className="auth-page myinv-page myinv-page--accent">
      <div className={`auth-page-stack${slideIn ? ' page-slide-in' : ''}`}>
        <div className="auth-title-bar">{title}</div>
        <div className="auth-card-wrap shadow-border-wrap">
          <span className="shadow-border" aria-hidden="true" />
          <div className="auth-card-inner about-card auth-about-card">
            <div className="auth-card-content">{children}</div>
          </div>
        </div>
        {belowCard && <div className="auth-below-card-outer">{belowCard}</div>}
      </div>
    </div>
  );
};

export default AuthPageShell;
