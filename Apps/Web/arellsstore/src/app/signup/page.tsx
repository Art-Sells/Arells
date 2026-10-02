import type { Metadata } from 'next';
import SignUpPageClient from '../../components/Auth/SignUpPageClient';
import { buildWebPageJsonLd } from '../../lib/pageWebPageJsonLd';
const generalBanner = '/images/banners/ArellsGeneralBannerOfficial.jpg';

const title = 'Sign up';
const description =
  'Sign up to join our mission to ensure investments never lose value. Powered by Vavity.';

export const metadata: Metadata = {
  title,
  description,
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/signup',
  },
  openGraph: {
    title,
    description,
    url: '/signup',
    type: 'website',
    images: [{ url: generalBanner }],
  },
  twitter: {
    title,
    description,
    card: 'summary_large_image',
    images: [{ url: generalBanner }],
  },
};

export default function SignUpPage() {
  return (
    <>
      <main>
        <div className="server-seo-summary">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <SignUpPageClient />
      </main>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger -- JSON-LD requires raw script injection
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildWebPageJsonLd({ title, description, path: '/signup' })),
        }}
      />
    </>
  );
}
