import type { Metadata } from 'next';
import { STOCK_SQUARE_METAPOSTER_SRC } from '../../../lib/assets/assetSharePath';
import { iconAssetUrl as u } from '../../../lib/iconAssetUrl';
import BitcoinMyCharacterPageClient from './BitcoinMyCharacterPageClient';

const path = '/bitcoin/my-character';
const title = 'My Character';
const description =
  'In our universe, your Bitcoin investments are lifeless… But in another universe, they are alive, and are on a mission to live forever.';
/** Same metaposter as the Bitcoin asset page. */
const banner = STOCK_SQUARE_METAPOSTER_SRC;
/** Same favicon as the Bitcoin asset page. */
const favicon = u('/images/favicons/BtcBadge.svg');

export const metadata: Metadata = {
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

const BitcoinMyCharacterPage = () => {
  return <BitcoinMyCharacterPageClient />;
};

export default BitcoinMyCharacterPage;
