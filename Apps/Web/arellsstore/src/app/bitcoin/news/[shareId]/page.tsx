import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { iconAssetUrl as u } from '../../../../lib/iconAssetUrl';
import { resolveReferrerEmailFromCode } from '../../../../lib/auth/referral';
import BitcoinNewsPageClient from '../BitcoinNewsPageClient';

const title = 'Bitcoin News';
/** Same metaposter as the Bitcoin asset / bare news route. */
const banner =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/posters/LaunchPoster(metaposter).jpg';
const favicon = u('/images/favicons/BtcBadge.svg');

type PageProps = {
  params: Promise<{ shareId: string }>;
};

export async function generateMetadata(_props: PageProps): Promise<Metadata> {
  const path = '/bitcoin/news';

  return {
    title,
    robots: { index: false, follow: true },
    alternates: {
      canonical: path,
    },
    icons: {
      shortcut: favicon,
      icon: [
        { url: favicon, type: 'image/svg+xml' },
        { url: u('/ArellsIcon.png'), type: 'image/png', sizes: '192x192' },
      ],
      apple: [{ url: favicon, type: 'image/svg+xml', sizes: '180x180' }],
    },
    openGraph: {
      title,
      url: path,
      type: 'website',
      images: [{ url: banner }],
    },
    twitter: {
      title,
      card: 'summary_large_image',
      images: [{ url: banner }],
    },
  };
}

const BitcoinNewsSharePage = async ({ params }: PageProps) => {
  const { shareId: raw } = await params;
  const shareId = (raw || '').trim().toLowerCase();
  if (!shareId || !/^[a-z0-9]{6,64}$/.test(shareId)) {
    redirect('/bitcoin/news');
  }

  const email = await resolveReferrerEmailFromCode(shareId);
  if (!email) {
    redirect('/bitcoin/news');
  }

  return <BitcoinNewsPageClient pathShareId={shareId} />;
};

export default BitcoinNewsSharePage;
