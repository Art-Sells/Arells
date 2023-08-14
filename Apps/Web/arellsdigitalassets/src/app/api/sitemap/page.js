import { create } from 'xmlbuilder2';

export default async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  // Fetch your routes here. For the sake of this example, we'll use a static list.
  const routes = [
    '/',
    '/stayupdated',
    '/prototype-seller-collected'
    // ... add more routes or fetch them dynamically from your CMS or database
  ];

  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('urlset', { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' });

  routes.forEach(route => {
    const url = root.ele('url');
    url.ele('loc', `https://arells.com${route}`);
    url.ele('changefreq', 'daily');
    url.ele('priority', '0.7');
  });

  const xml = root.end({ prettyPrint: true });

  res.setHeader('Content-Type', 'text/xml');
  res.write(xml);
  res.end();
};