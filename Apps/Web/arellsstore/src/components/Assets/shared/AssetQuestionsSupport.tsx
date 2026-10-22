'use client';

import React from 'react';
import { PORTFOLIO_SUPPORT_EMAIL } from '../../MyPortfolio/PortfolioQuestionsSupport';

type AssetQuestionsSupportProps = {
  cssModifier: string;
};

/** Questions/Concerns under the about button — double border + wash match asset sections. */
export default function AssetQuestionsSupport({ cssModifier }: AssetQuestionsSupportProps) {
  return (
    <div className="myportfolio-questions-support-shell asset-questions-support-shell">
      <div className="site-social-footer-rule myportfolio-questions-support-rule" aria-hidden="true" />
      <div className="myinv-panel-group myportfolio-portfolio-below-panel myportfolio-questions-panel">
        <div className="myinv-panel-title myinv-panel-title--add myinv-title-accent">Questions/Concerns?</div>
        <div className="myportfolio-portfolio-below-panel-wrap shadow-border-wrap">
          <span className="shadow-border" aria-hidden="true" />
          <div
            className={`myinv-panel-section myinv-accent-border myportfolio-email-support-panel asset-panel--${cssModifier}`}
          >
            <div className="myinv-panel myinv-panel--shell">
              <div className="myportfolio-email-support-copy">
                <span className="myportfolio-email-support-copy-text">Email us:</span>
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
    </div>
  );
}
