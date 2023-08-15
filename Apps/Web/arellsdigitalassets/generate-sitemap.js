const fs = require('fs');
const axios = require('axios');
const xmlbuilder = require('xmlbuilder');

const fetchData = async () => {
  // Fetch your list of pages or routes here. For this example, I'll use a static list.
  // You could make an API call or query your database for dynamic routes.
  return ['/', '/stayupdated', '/prototype-seller-created'];
};

const generateSitemap = async () => {
  const baseUrl = 'https://arells.com';
  const routes = await fetchData();

  const root = xmlbuilder.create('urlset').att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

  routes.forEach(route => {
    const url = root.ele('url');
    url.ele('loc', baseUrl + route);
    url.ele('changefreq', 'daily');
    // Add any other properties you need here
  });

  const xmlString = root.end({ pretty: true });
  fs.writeFileSync('public/sitemap.xml', xmlString);
};

generateSitemap();