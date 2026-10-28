import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { iconAssetUrl as u } from '../../../../lib/iconAssetUrl';
import { resolveReferrerEmailFromCode } from '../../../../lib/auth/referral';
import BitcoinMyCharacterPageClient from '../BitcoinMyCharacterPageClient';

const title = 'My Character';
const description =
  'In our universe, your Bitcoin investments are lifeless… But in another universe, they are alive, and are on a mission to live forever.';
/** Same metaposter as the Bitcoin asset page / bare my-character route. */
const banner =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/posters/LaunchPoster(metaposter).jpg';
const favicon = u('/images/favicons/BtcBadge.svg');

type PageProps = {
  params: Promise<{ shareId: string }>;
};

/** Same metadata as /bitcoin/my-character (title, description, banner, canonical). */
export async function generateMetadata(_props: PageProps): Promise<Metadata> {
  const path = '/bitcoin/my-character';

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
      images: [{ url: banner }],
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image',
      images: [{ url: banner }],
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
