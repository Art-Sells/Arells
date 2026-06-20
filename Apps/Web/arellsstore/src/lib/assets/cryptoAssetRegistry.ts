import type { Metadata } from 'next';
import { iconAssetUrl as u } from '../iconAssetUrl';
import { buildAssetMetaDescription } from '../siteMetaDescriptions';

export type VapaAssetConfig = {
  id: string;
  coingeckoId?: string;
  s3Key: string;
  priceUrl: string;
  historyUrl: string;
};

export type CryptoAssetTheme = 'bitcoin' | 'ethereum' | 'xrp' | 'bnb' | 'solana' | 'tron' | 'doge' | 'cardano';

export type CryptoAssetConfig = {
  id: string;
  href: string;
  label: string;
  ticker: string;
  displayName: string;
  theme: CryptoAssetTheme;
  cssModifier: string;
  coingeckoId: string;
  s3VapaKey: string;
  metaTitle: string;
  faviconPath: string;
  ogBannerPath: string;
};

const COINGECKO_PRO = 'https://pro-api.coingecko.com/api/v3';

export const CRYPTO_ASSETS: readonly CryptoAssetConfig[] = [
  {
    id: 'bitcoin',
    href: '/bitcoin',
    label: 'Bitcoin',
    ticker: 'BTC',
    displayName: 'Bitcoin',
    theme: 'bitcoin',
    cssModifier: 'bitcoin',
    coingeckoId: 'bitcoin',
    s3VapaKey: 'vavity/bitcoinVAPA.json',
    metaTitle: 'Bitcoin never loses value',
    faviconPath: '/images/favicons/BtcBadge.svg',
    ogBannerPath: '/images/banners/assets/crypto/Bitcoin/ArellsBTCBanner.jpg',
  },
  {
    id: 'ethereum',
    href: '/ethereum',
    label: 'Ethereum',
    ticker: 'ETH',
    displayName: 'Ethereum',
    theme: 'ethereum',
    cssModifier: 'ethereum',
    coingeckoId: 'ethereum',
    s3VapaKey: 'vavity/ethereumVAPA.json',
    metaTitle: 'Ethereum never loses value',
    faviconPath: '/images/favicons/EthBadge.svg',
    ogBannerPath: '/images/banners/assets/crypto/Ethereum/ArellsETHBanner.jpg',
  },
  {
    id: 'xrp',
    href: '/xrp',
    label: 'XRP',
    ticker: 'XRP',
    displayName: 'XRP',
    theme: 'xrp',
    cssModifier: 'xrp',
    coingeckoId: 'ripple',
    s3VapaKey: 'vavity/xrpVAPA.json',
    metaTitle: 'XRP never loses value',
    faviconPath: '/images/favicons/XrpBadge.svg',
    ogBannerPath: '/images/banners/assets/crypto/XRP/ArellsXRPBanner.jpg',
  },
  {
    id: 'bnb',
    href: '/bnb',
    label: 'BNB',
    ticker: 'BNB',
    displayName: 'BNB',
    theme: 'bnb',
    cssModifier: 'bnb',
    coingeckoId: 'binancecoin',
    s3VapaKey: 'vavity/bnbVAPA.json',
    metaTitle: 'BNB never loses value',
    faviconPath: '/images/favicons/BnbBadge.svg',
    ogBannerPath: '/images/banners/assets/crypto/BNB/ArellsBNBBanner.jpg',
  },
  {
    id: 'solana',
    href: '/solana',
    label: 'Solana',
    ticker: 'SOL',
    displayName: 'Solana',
    theme: 'solana',
    cssModifier: 'solana',
    coingeckoId: 'solana',
    s3VapaKey: 'vavity/solanaVAPA.json',
    metaTitle: 'Solana never loses value',
    faviconPath: '/images/favicons/SolBadge.svg',
    ogBannerPath: '/images/banners/assets/crypto/Solana/ArellsSOLBanner.jpg',
  },
  {
    id: 'tron',
    href: '/tron',
    label: 'Tron',
    ticker: 'TRX',
    displayName: 'Tron',
    theme: 'tron',
    cssModifier: 'tron',
    coingeckoId: 'tron',
    s3VapaKey: 'vavity/tronVAPA.json',
    metaTitle: 'Tron never loses value',
    faviconPath: '/images/favicons/TronBadge.svg',
    ogBannerPath: '/images/banners/assets/crypto/Tron/ArellsTRXBanner.jpg',
  },
  {
    id: 'doge',
    href: '/dogecoin',
    label: 'Dogecoin',
    ticker: 'DOGE',
    displayName: 'Dogecoin',
    theme: 'doge',
    cssModifier: 'doge',
    coingeckoId: 'dogecoin',
    s3VapaKey: 'vavity/dogeVAPA.json',
    metaTitle: 'Dogecoin never loses value',
    faviconPath: '/images/favicons/DogeBadge.svg',
    ogBannerPath: '/images/banners/assets/crypto/Dogecoin/ArellsDOGEBanner.jpg',
  },
  {
    id: 'cardano',
    href: '/cardano',
    label: 'Cardano',
    ticker: 'ADA',
    displayName: 'Cardano',
    theme: 'cardano',
    cssModifier: 'cardano',
    coingeckoId: 'cardano',
    s3VapaKey: 'vavity/cardanoVAPA.json',
    metaTitle: 'Cardano never loses value',
    faviconPath: '/images/favicons/AdaBadge.svg',
    ogBannerPath: '/images/banners/assets/crypto/Cardano/ArellsADABanner.jpg',
  },
] as const;

export type CryptoAssetId = (typeof CRYPTO_ASSETS)[number]['id'];

export const SUPPORTED_CRYPTO_ASSET_IDS: CryptoAssetId[] = CRYPTO_ASSETS.map((a) => a.id);

/** Home `/` table: first paint through Tron (TRX); overflow assets load on "Show more assets". */
export const HOME_INITIAL_ASSET_COUNT = 6;
export const HOME_LOAD_MORE_BATCH = 6;

export function getHomeInitialAssetIds(): CryptoAssetId[] {
  return CRYPTO_ASSETS.slice(0, HOME_INITIAL_ASSET_COUNT).map((a) => a.id);
}

export function getHomeOverflowAssetIds(): CryptoAssetId[] {
  return CRYPTO_ASSETS.slice(HOME_INITIAL_ASSET_COUNT).map((a) => a.id);
}

export const CRYPTO_ASSET_BY_ID: Record<CryptoAssetId, CryptoAssetConfig> = Object.fromEntries(
  CRYPTO_ASSETS.map((a) => [a.id, a])
) as Record<CryptoAssetId, CryptoAssetConfig>;

export const CRYPTO_VAPA_KEYS: Record<string, string> = Object.fromEntries(
  CRYPTO_ASSETS.map((a) => [a.id, a.s3VapaKey])
);

export function getCryptoAssetMeta(id: string): Pick<CryptoAssetConfig, 'href' | 'label'> | null {
  const asset = CRYPTO_ASSET_BY_ID[id as CryptoAssetId];
  if (!asset) return null;
  return { href: asset.href, label: asset.label };
}

export function getVapaRefreshConfigs(): VapaAssetConfig[] {
  return CRYPTO_ASSETS.map((a) => ({
    id: a.id,
    ...(a.coingeckoId !== a.id ? { coingeckoId: a.coingeckoId } : {}),
    s3Key: a.s3VapaKey,
    priceUrl: `${COINGECKO_PRO}/simple/price?ids=${a.coingeckoId}&vs_currencies=usd&include_market_cap=true`,
    historyUrl: `${COINGECKO_PRO}/coins/${a.coingeckoId}/market_chart?vs_currency=usd&days=max`,
  }));
}

export function getAssetSpotPriceEntries(): Record<string, { path: string; responseKey: string }> {
  return Object.fromEntries(
    CRYPTO_ASSETS.map((a) => [
      a.id,
      {
        path: `/api/assets/crypto/${a.id}/${a.id}Price`,
        responseKey: a.coingeckoId,
      },
    ])
  );
}

export function buildCryptoAssetPageMetadata(assetId: CryptoAssetId): Metadata {
  const asset = CRYPTO_ASSET_BY_ID[assetId];
  const favicon = u(asset.faviconPath);
  const description = buildAssetMetaDescription(asset.displayName);
  return {
    title: asset.metaTitle,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: asset.href,
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
      title: asset.metaTitle,
      description,
      url: asset.href,
      type: 'website',
      images: [{ url: asset.ogBannerPath }],
    },
    twitter: {
      title: asset.metaTitle,
      description,
      card: 'summary_large_image',
      images: [{ url: asset.ogBannerPath }],
    },
  };
}
