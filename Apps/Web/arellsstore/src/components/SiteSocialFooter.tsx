'use client';

import { usePathname } from 'next/navigation';

function footerHiddenForPath(pathname: string): boolean {
  if (pathname === '/about') return true;
  if (pathname === '/signin' || pathname === '/signup' || pathname === '/forgot-password') return true;
  if (pathname.startsWith('/reset-password')) return true;
  if (pathname.startsWith('/verified')) return true;
  if (pathname === '/metrics' || pathname.startsWith('/metrics/')) return true;
  if (pathname.startsWith('/vavity')) return true;
  return false;
}

type FooterVariant = 'accent' | 'bitcoin' | 'ethereum' | 'xrp' | 'bnb' | 'solana' | 'default';

function variantForPath(pathname: string): FooterVariant {
  const path = (pathname || '/').replace(/\/+$/, '') || '/';
  if (path === '/' || path === '/my-investments') return 'accent';
  const seg = path.split('/').filter(Boolean)[0];
  if (seg === 'bitcoin') return 'bitcoin';
  if (seg === 'ethereum') return 'ethereum';
  if (seg === 'xrp') return 'xrp';
  if (seg === 'bnb') return 'bnb';
  if (seg === 'solana') return 'solana';
  return 'default';
}

const SOCIAL_X = 'https://x.com/arellsinc';
const SOCIAL_TELEGRAM = 'https://t.me/+FauIWiryMRRjMjZh';

export type SiteSocialFooterProps = {
  variant?: FooterVariant;
  /** Show on routes that normally hide the footer (e.g. `/verified/*`) when embedded in page content. */
  forceShow?: boolean;
};

export default function SiteSocialFooter({ variant: variantProp, forceShow }: SiteSocialFooterProps = {}) {
  const pathname = usePathname() || '';
  if (!forceShow && footerHiddenForPath(pathname)) return null;

  const variant = variantProp ?? variantForPath(pathname);
  const variantClass =
    variant === 'accent'
      ? 'site-social-footer--accent'
      : variant === 'default'
        ? 'site-social-footer--default'
        : `site-social-footer--asset site-social-footer--${variant}`;

  const linkClassName = 'site-social-footer-link site-social-footer-link--accent';

  return (
    <footer className={`site-social-footer ${variantClass}`} aria-label="Social links">
      <div className="site-social-footer-inner">
        <div className="site-social-footer-rule" aria-hidden="true" />
        <p className="site-social-footer-label">Follow us:</p>
        <div className="site-social-footer-buttons">
          <a
            href={SOCIAL_X}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
            aria-label="Arells on X"
          >
            <span className="site-social-footer-icon site-social-footer-icon--x" aria-hidden />
          </a>
          <a
            href={SOCIAL_TELEGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
            aria-label="Arells on Telegram"
          >
            <span className="site-social-footer-icon site-social-footer-icon--telegram" aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  );
}
