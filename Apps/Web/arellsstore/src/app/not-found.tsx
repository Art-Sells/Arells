import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <h1 className="not-found-page__code">404</h1>
      <p className="not-found-page__message">This page could not be found.</p>
      <Link href="/" className="not-found-page__home-link asset-range-button myinv-range-button">
        go home
      </Link>
    </div>
  );
}
