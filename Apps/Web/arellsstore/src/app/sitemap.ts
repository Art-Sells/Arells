import type { MetadataRoute } from 'next';
import { CRYPTO_ASSETS } from '../lib/assets/cryptoAssetRegistry';
import { getSiteMetadataBase } from '../lib/siteMetadataBase';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteMetadataBase().origin;
  const now = new Date();

  const staticPaths = ['', '/signin', '/signup', '/about', '/my-investments', '/vavity'];

  return [
    ...staticPaths.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: path === '' ? 1 : 0.8,
    })),
    ...CRYPTO_ASSETS.map((asset) => ({
      url: `${base}${asset.href}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
  ];
}
