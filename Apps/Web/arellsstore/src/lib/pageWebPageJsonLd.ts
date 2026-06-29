import { getSiteMetadataBase } from './siteMetadataBase';

export type PageSeoFields = {
  title: string;
  description: string;
  /** Canonical path, e.g. `/` or `/signin`. */
  path: string;
};

export function pageCanonicalUrl(path: string): string {
  const origin = getSiteMetadataBase().origin;
  const pathname = path.startsWith('/') ? path : `/${path}`;
  return new URL(pathname, origin).href;
}

/** Per-route WebPage JSON-LD (paired with `<main>` copy that matches `metadata.description`). */
export function buildWebPageJsonLd({ title, description, path }: PageSeoFields) {
  const url = pageCanonicalUrl(path);
  const origin = getSiteMetadataBase().origin;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: 'en-US',
    isPartOf: { '@id': `${origin}/#website` },
  };
}
