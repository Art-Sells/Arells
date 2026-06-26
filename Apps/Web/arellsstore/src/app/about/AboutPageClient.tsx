'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import HomeAboutMountLoader from '../../components/HomeAboutMountLoader';
import { emailVerifiedWelcomePhaseCopy } from '../../content/emailVerifiedWelcomeCopy';

const AboutPageClient = () => {
  const [aboutSlideIn, setAboutSlideIn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAboutSlideIn(true), 50);
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
      <div className="about-page">
        <div className={`about-card shadow-border-wrap${aboutSlideIn ? ' page-slide-in' : ''}`}>
          <span className="shadow-border" aria-hidden="true" />
          <div className="about-icon-wrap">
            <Link href="/" className="asset-action-button about-icon-button" aria-label="Arells">
              <span className="about-icon" aria-hidden="true" />
            </Link>
          </div>
          <div className={`about-content${aboutSlideIn ? ' page-slide-in' : ''}`}>
            <div className="about-section about-section--outer myinv-accent-border">
              <div className="about-section about-section--lead myinv-accent-border">
                <p className="about-text about-text--outer">
                  Arells is on a mission to ensure investments never lose value.
                </p>
              </div>
              <div className="about-section about-section--mid myinv-accent-border">
                <div className="about-section about-section--mid-body myinv-accent-border">
                  <p className="about-text about-text--mid">
                    Powered by a ledger that shows your investments never losing value.
                  </p>
                </div>
                <div className="about-section about-section--inner myinv-accent-border">
                  <div className="about-section about-section--inner-body myinv-accent-border">
                    <p className="about-text about-text--inner">
                      Powered by a new psychological and technological invention called Vavity.
                    </p>
                  </div>
                  <div className="about-section about-section--cta myinv-accent-border">
                    <button
                      type="button"
                      onClick={() => window.open('/vavity', '_blank')}
                      className="asset-range-button myinv-range-button about-cta-button"
                    >
                      Learn more
                    </button>
                  </div>
                </div>
                <div className="about-section about-section--mid-body myinv-accent-border">
                  <p className="about-text about-text--mid">
                    We are currently in Phase One of our mission.
                  </p>
                </div>
                <div className="about-section about-section--mid-body myinv-accent-border">
                  <div className="about-phase-copy-column">
                    <p className="about-text about-text--mid">
                      <strong>{emailVerifiedWelcomePhaseCopy.phaseOneTitle}</strong>
                    </p>
                    <p className="about-text about-text--mid">{emailVerifiedWelcomePhaseCopy.phaseOneLead}</p>
                    <ul className="about-phase-list">
                      {emailVerifiedWelcomePhaseCopy.phaseOneBullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="about-section about-section--mid-body myinv-accent-border">
                  <div className="about-phase-copy-column">
                    <p className="about-text about-text--mid">
                      <strong>{emailVerifiedWelcomePhaseCopy.phaseTwoTitle}</strong>
                    </p>
                    <p className="about-text about-text--mid">{emailVerifiedWelcomePhaseCopy.phaseTwoLead}</p>
                    <ul className="about-phase-list">
                      {emailVerifiedWelcomePhaseCopy.phaseTwoBullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutPageClient;
