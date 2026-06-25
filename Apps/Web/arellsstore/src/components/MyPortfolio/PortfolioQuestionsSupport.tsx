'use client';

import React from 'react';

export const PORTFOLIO_SUPPORT_EMAIL = 'info@arells.com';

const PortfolioQuestionsSupport: React.FC = () => (
  <div className="myinv-panel-group myportfolio-portfolio-below-panel myportfolio-questions-panel page-slide-in">
    <div className="myinv-panel-title myinv-panel-title--add myinv-title-accent">Questions/Concerns?</div>
    <div className="myportfolio-portfolio-below-panel-wrap shadow-border-wrap">
      <span className="shadow-border" aria-hidden="true" />
      <div className="myinv-panel-section myinv-accent-border myportfolio-email-support-panel">
        <div className="myinv-panel myinv-panel--shell">
          <div className="myportfolio-email-support-copy">
            <p className="myportfolio-email-support-copy-text">Email us:</p>
            <a
              href={`mailto:${PORTFOLIO_SUPPORT_EMAIL}`}
              className="site-social-footer-link site-social-footer-link--accent"
              aria-label="Email Arells"
            >
              <span className="site-social-footer-icon site-social-footer-icon--email" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default PortfolioQuestionsSupport;
