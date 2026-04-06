'use client';

import React, { useEffect, useState } from 'react';
import '../../app/css/Home.css';
import '../../app/css/HomeLoaderOverrides.css';

type AuthPageShellProps = {
  children: React.ReactNode;
  title: string;
  belowCard?: React.ReactNode;
};

const AuthPageShell: React.FC<AuthPageShellProps> = ({ children, title, belowCard }) => {
  const [slideIn, setSlideIn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlideIn(true), 50);
    return () => clearTimeout(t);
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
      <div className={`auth-title-bar${slideIn ? ' page-slide-in' : ''}`}>{title}</div>
      <div className={`auth-card-wrap shadow-border-wrap${slideIn ? ' page-slide-in' : ''}`}>
        <span className="shadow-border" aria-hidden="true" />
        <div className="auth-card-inner about-card auth-about-card">
          <div className="auth-card-content">{children}</div>
        </div>
      </div>
      {belowCard && (
        <div className={`auth-below-card-outer${slideIn ? ' page-slide-in' : ''}`}>
          {belowCard}
        </div>
      )}
    </div>
  );
};

export default AuthPageShell;
