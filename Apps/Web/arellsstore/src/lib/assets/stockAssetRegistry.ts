import type { Metadata } from 'next';
import { iconAssetUrl as u } from '../iconAssetUrl';
import type { PageSeoFields } from '../pageWebPageJsonLd';
import { buildAssetMetaDescription } from '../siteMetaDescriptions';

export type StockAssetTheme = 'nvidia' | 'spacex' | 'apple' | 'alphabet' | 'microsoft' | 'amazon';

export type StockAssetConfig = {
  id: string;
  href: string;
  label: string;
  ticker: string;
  displayName: string;
  theme: StockAssetTheme;
  cssModifier: string;
  massiveTicker: string;
  s3VapaKey: string;
  /** Exchange list / IPO day (`YYYY-MM-DD`) — used to drop Massive pre-list junk bars. */
  listDate?: string;
  metaTitle: string;
  faviconPath: string;
  ogBannerPath: string;
  companyUrl: string;
};

export const STOCK_ASSETS: readonly StockAssetConfig[] = [
  {
    id: 'nvidia',
    href: '/nvidia',
    label: 'NVIDIA',
    ticker: 'NVDA',
    displayName: 'NVIDIA',
    theme: 'nvidia',
    cssModifier: 'nvidia',
    massiveTicker: 'NVDA',
    s3VapaKey: 'vavity/nvidiaVAPA.json',
    metaTitle: 'NVIDIA never loses value',
    faviconPath: '/images/favicons/NvdaBadge.svg',
    ogBannerPath: '/images/banners/assets/stocks/Nvidia/ArellsNVDABanner.jpg',
    companyUrl: 'https://www.nvidia.com/',
  },
  {
    id: 'apple',
    href: '/apple',
    label: 'Apple',
    ticker: 'AAPL',
    displayName: 'Apple',
    theme: 'apple',
    cssModifier: 'apple',
    massiveTicker: 'AAPL',
    s3VapaKey: 'vavity/appleVAPA.json',
    metaTitle: 'Apple never loses value',
    faviconPath: '/images/favicons/AaplBadge.svg',
    ogBannerPath: '/images/banners/assets/stocks/Apple/ArellsAAPLBanner.jpg',
    companyUrl: 'https://www.apple.com/',
  },
  {
    id: 'alphabet',
    href: '/alphabet',
    label: 'Alphabet',
    ticker: 'GOOGL',
    displayName: 'Alphabet',
    theme: 'alphabet',
    cssModifier: 'alphabet',
    massiveTicker: 'GOOGL',
    s3VapaKey: 'vavity/alphabetVAPA.json',
    metaTitle: 'Alphabet never loses value',
    faviconPath: '/images/favicons/GooglBadge.svg',
    ogBannerPath: '/images/banners/assets/stocks/Alphabet/ArellsGOOGLBanner.jpg',
    companyUrl: 'https://abc.xyz/',
  },
  {
    id: 'microsoft',
    href: '/microsoft',
    label: 'Microsoft',
    ticker: 'MSFT',
    displayName: 'Microsoft',
    theme: 'microsoft',
    cssModifier: 'microsoft',
    massiveTicker: 'MSFT',
    s3VapaKey: 'vavity/microsoftVAPA.json',
    metaTitle: 'Microsoft never loses value',
    faviconPath: '/images/favicons/MsftBadge.svg',
    ogBannerPath: '/images/banners/assets/stocks/Microsoft/ArellsMSFTBanner.jpg',
    companyUrl: 'https://www.microsoft.com/',
  },
  {
    id: 'amazon',
    href: '/amazon',
    label: 'Amazon',
    ticker: 'AMZN',
    displayName: 'Amazon',
    theme: 'amazon',
    cssModifier: 'amazon',
    massiveTicker: 'AMZN',
    s3VapaKey: 'vavity/amazonVAPA.json',
    metaTitle: 'Amazon never loses value',
    faviconPath: '/images/favicons/AmznBadge.svg',
    ogBannerPath: '/images/banners/assets/stocks/Amazon/ArellsAMZNBanner.jpg',
    companyUrl: 'https://www.amazon.com/',
  },
  {
    id: 'spacex',
    href: '/spacex',
    label: 'SpaceX',
    ticker: 'SPCX',
    displayName: 'SpaceX',
    theme: 'spacex',
    cssModifier: 'spacex',
    massiveTicker: 'SPCX',
    s3VapaKey: 'vavity/spacexVAPA.json',
    listDate: '2026-06-12',
    metaTitle: 'SpaceX never loses value',
    faviconPath: '/images/favicons/SpcxBadge.svg',
    ogBannerPath: '/images/banners/assets/stocks/SpaceX/ArellsSPCXBanner.jpg',
    companyUrl: 'https://www.spacex.com/',
  },
];

export type StockAssetId = (typeof STOCK_ASSETS)[number]['id'];

export const SUPPORTED_STOCK_ASSET_IDS: StockAssetId[] = STOCK_ASSETS.map((a) => a.id);

export const STOCK_ASSET_BY_ID: Record<StockAssetId, StockAssetConfig> = Object.fromEntries(
  STOCK_ASSETS.map((a) => [a.id, a])
) as Record<StockAssetId, StockAssetConfig>;

export const STOCK_VAPA_KEYS: Record<string, string> = Object.fromEntries(
  STOCK_ASSETS.map((a) => [a.id, a.s3VapaKey])
);

export function isStockAssetId(id: string): boolean {
  return id in STOCK_ASSET_BY_ID;
}

export function getStockAssetMeta(id: string): Pick<StockAssetConfig, 'href' | 'label'> | null {
  const asset = STOCK_ASSET_BY_ID[id as StockAssetId];
  if (!asset) return null;
  return { href: asset.href, label: asset.label };
}

export function getStockAssetPageSeo(assetId: StockAssetId): PageSeoFields {
  const asset = STOCK_ASSET_BY_ID[assetId];
  return {
    title: asset.metaTitle,
    description: buildAssetMetaDescription(asset.displayName),
    path: asset.href,
  };
}

export function buildStockAssetPageMetadata(assetId: StockAssetId): Metadata {
  const asset = STOCK_ASSET_BY_ID[assetId];
  const favicon = u(asset.faviconPath);
  const description = buildAssetMetaDescription(asset.displayName);
  return {
    title: asset.metaTitle,
    description,
    robots: { index: false, follow: true },
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

export function getStockAssetSpotPriceEntries(): Record<string, { path: string; responseKey: string }> {
  return Object.fromEntries(
    STOCK_ASSETS.map((a) => [
      a.id,
      {
        path: `/api/assets/stocks/${a.id}/${a.id}Price`,
        responseKey: a.id,
      },
    ])
  );
}
