'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import HomeAboutMountLoader from '../../components/HomeAboutMountLoader';

const LAST_UPDATED = 'November 21, 2026';

const PrivacyPageClient = () => {
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
    <>
      <HomeAboutMountLoader />
      <div className="about-page privacy-page">
        <div className={`about-card privacy-card shadow-border-wrap${slideIn ? ' page-slide-in' : ''}`}>
          <span className="shadow-border" aria-hidden="true" />
          <div className="about-icon-wrap">
            <Link href="/" className="asset-action-button about-icon-button" aria-label="Arells">
              <span className="about-icon" aria-hidden="true" />
            </Link>
          </div>
          <div className={`about-content privacy-content${slideIn ? ' page-slide-in' : ''}`}>
            <div className="about-section about-section--outer myinv-accent-border">
              <div className="about-section about-section--lead myinv-accent-border">
                <p className="about-text about-text--outer privacy-title">Privacy Policy</p>
                <p className="privacy-updated">Last updated: {LAST_UPDATED}</p>
              </div>

              <div className="about-section about-section--mid myinv-accent-border">
                <section className="about-section about-section--mid-body myinv-accent-border privacy-block">
                  <h2 className="privacy-heading">Who we are</h2>
                  <p className="privacy-body">
                    Arells, Inc (&ldquo;Arells,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) operates arells.com
                    and related apps. This policy explains what information we collect and how we use
                    it when you use our services.
                  </p>
                </section>

                <section className="about-section about-section--mid-body myinv-accent-border privacy-block">
                  <h2 className="privacy-heading">Information we collect</h2>
                  <p className="privacy-body">
                    <strong>Account.</strong> Email address; a hashed password if you sign up with
                    email; and, if you use Sign in with Google, your Google account email and a Google
                    account identifier so we can link that login to your Arells account.
                  </p>
                  <p className="privacy-body">
                    <strong>Product data.</strong> Information you provide in the product, such as
                    investment entries, portfolio settings, referrals, and character or media content
                    you create or upload.
                  </p>
                  <p className="privacy-body">
                    <strong>Payments.</strong> If you buy character generation or similar paid
                    features, payment is processed by Stripe. We receive payment status and related
                    identifiers; we do not store your full card number.
                  </p>
                  <p className="privacy-body">
                    <strong>Usage.</strong> When analytics are enabled for signed-in users, we may
                    store page-visit signals with a hashed user id (not your raw email), plus technical
                    details needed to run the service (for example request timing and approximate
                    location derived from network data where applicable).
                  </p>
                </section>

                <section className="about-section about-section--mid-body myinv-accent-border privacy-block">
                  <h2 className="privacy-heading">How we use information</h2>
                  <ul className="privacy-list">
                    <li>Create and secure your account, including email verification and password reset</li>
                    <li>Sign you in with email/password or Google and keep you signed in</li>
                    <li>Provide portfolio, character, news, and related product features</li>
                    <li>Process payments and fulfill paid features through Stripe</li>
                    <li>Send transactional email (verification codes, password resets)</li>
                    <li>Improve reliability, security, and product experience</li>
                    <li>Comply with law and enforce our terms</li>
                  </ul>
                </section>

                <section className="about-section about-section--mid-body myinv-accent-border privacy-block">
                  <h2 className="privacy-heading">Cookies and similar technology</h2>
                  <p className="privacy-body">
                    We use cookies that are necessary for the service, including a signed session
                    cookie after you sign in, and a short-lived referral cookie when you arrive via a
                    referral link. These are not used for third-party advertising.
                  </p>
                </section>

                <section className="about-section about-section--mid-body myinv-accent-border privacy-block">
                  <h2 className="privacy-heading">Sharing</h2>
                  <p className="privacy-body">
                    We do not sell your personal information. We share data with service providers
                    that help us operate Arells, including:
                  </p>
                  <ul className="privacy-list">
                    <li>Amazon Web Services (hosting, storage, and email delivery)</li>
                    <li>Google (if you choose Sign in with Google)</li>
                    <li>Stripe (payments)</li>
                  </ul>
                  <p className="privacy-body">
                    We may also disclose information if required by law or to protect Arells, our
                    users, or the public.
                  </p>
                </section>

                <section className="about-section about-section--mid-body myinv-accent-border privacy-block">
                  <h2 className="privacy-heading">Retention</h2>
                  <p className="privacy-body">
                    We keep account and product data while your account is active and as needed to
                    provide the service, resolve disputes, and meet legal obligations. You may contact
                    us to request deletion of your account data, subject to those obligations.
                  </p>
                </section>

                <section className="about-section about-section--mid-body myinv-accent-border privacy-block">
                  <h2 className="privacy-heading">Security</h2>
                  <p className="privacy-body">
                    We use industry-standard practices such as hashed passwords, encrypted transport
                    (HTTPS), and access-controlled storage. No method of transmission or storage is
                    completely secure.
                  </p>
                </section>

                <section className="about-section about-section--mid-body myinv-accent-border privacy-block">
                  <h2 className="privacy-heading">Children</h2>
                  <p className="privacy-body">
                    Arells is not directed to children under 13, and we do not knowingly collect
                    personal information from children under 13.
                  </p>
                </section>

                <section className="about-section about-section--mid-body myinv-accent-border privacy-block">
                  <h2 className="privacy-heading">Changes</h2>
                  <p className="privacy-body">
                    We may update this policy from time to time. The &ldquo;Last updated&rdquo; date
                    above will change when we do. Continued use of Arells after an update means you
                    accept the revised policy.
                  </p>
                </section>

                <section className="about-section about-section--mid-body myinv-accent-border privacy-block">
                  <h2 className="privacy-heading">Contact</h2>
                  <p className="privacy-body">
                    Questions about privacy:{' '}
                    <a className="privacy-link" href="mailto:info@arells.com">
                      info@arells.com
                    </a>
                  </p>
                  <p className="privacy-body privacy-body--muted">Arells, Inc</p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPageClient;
