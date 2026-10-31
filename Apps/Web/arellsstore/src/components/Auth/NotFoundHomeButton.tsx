'use client';

import Link from 'next/link';
import React, { useState } from 'react';

export default function NotFoundHomeButton() {
  const [loading, setLoading] = useState(false);

  return (
    <Link
      href="/"
      onClick={(event) => {
        if (loading) {
          event.preventDefault();
          return;
        }
        setLoading(true);
      }}
      aria-busy={loading || undefined}
      className={`auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button home-assets-show-more-button home-guest-signin-button${
        loading ? ' is-loading' : ''
      }`}
    >
      <span className="not-found-home-button-label">back to home</span>
      {loading ? (
        <span className="not-found-home-button-spinner" aria-hidden="true" />
      ) : null}
    </Link>
  );
}
