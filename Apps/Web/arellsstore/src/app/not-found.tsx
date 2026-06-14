import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="myinv-page myinv-page--accent myinv-page--portfolio myinv-page--weekly-guest not-found-page">
      <div className="home-guest-landing">
        <div className="home-guest-landing-stack">
          <span className="home-guest-icon-wrap" aria-hidden="true">
            <span className="home-guest-icon-tint" aria-hidden="true" />
            <Image
              src="/images/Arells-Icon.png"
              alt=""
              width={60}
              height={60}
              className="home-guest-icon-img"
              priority
            />
          </span>
          <p className="home-guest-slogan myportfolio-weekly-guest-pitch">
            <span className="myportfolio-weekly-guest-pitch-earn">
              <span className="myportfolio-weekly-guest-pitch-earn-word">page not found</span>
            </span>
          </p>
          <div className="home-guest-signin-shell shadow-border-wrap">
            <span className="shadow-border" aria-hidden="true" />
            <div className="home-guest-signin-panel myinv-accent-border">
              <div className="home-guest-signin-inner">
                <Link
                  href="/"
                  className="auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button home-assets-show-more-button home-guest-signin-button"
                >
                  back to home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
