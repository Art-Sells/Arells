import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { iconAssetUrl as u } from '../../../../lib/iconAssetUrl';
import { resolveReferrerEmailFromCode } from '../../../../lib/auth/referral';
import { composedSharePosterUrl } from '../../../../lib/server/composedSharePoster';
import BitcoinMyCharacterPageClient from '../BitcoinMyCharacterPageClient';

const title = 'My Character';
const description =
  'In our universe, your Bitcoin investments are lifeless… But in another universe, they are alive, and are on a mission to live forever.';
/** Stock still only when this user id has no composed character yet. */
const banner =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/posters/LaunchPoster(metaposter).jpg';
const favicon = u('/images/favicons/BtcBadge.svg');

type PageProps = {
  params: Promise<{ shareId: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareId: raw } = await params;
  const shareId = (raw || '').trim().toLowerCase();
  const path = shareId ? `/bitcoin/my-character/${shareId}` : '/bitcoin/my-character';
  const composed = shareId ? await composedSharePosterUrl(shareId) : null;
  const image = composed || banner;

  return {
    title,
    description,
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
      description,
      url: path,
      type: 'website',
      images: [{ url: image }],
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image',
      images: [{ url: image }],
    },
  };
}

const BitcoinMyCharacterSharePage = async ({ params }: PageProps) => {
  const { shareId: raw } = await params;
  const shareId = (raw || '').trim().toLowerCase();
  if (!shareId || !/^[a-z0-9]{6,64}$/.test(shareId)) {
    redirect('/bitcoin/my-character');
  }

  const email = await resolveReferrerEmailFromCode(shareId);
  if (!email) {
    redirect('/bitcoin');
  }

  return <BitcoinMyCharacterPageClient pathShareId={shareId} />;
};

export default BitcoinMyCharacterSharePage;
