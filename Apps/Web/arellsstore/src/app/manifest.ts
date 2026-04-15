import type { MetadataRoute } from 'next';

/** Android Chrome often uses manifest `icons` for tab / launcher artwork alongside `<link rel="icon">`. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Arells',
    short_name: 'Arells',
    description: 'If investments never lost value.',
    start_url: '/',
    display: 'browser',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
        purpose: 'any',
      },
      {
        src: '/ArellsIcoIcon.png',
        type: 'image/png',
        sizes: '192x192',
        purpose: 'any',
      },
      {
        src: '/ArellsIcoIcon.png',
        type: 'image/png',
        sizes: '512x512',
        purpose: 'any',
      },
    ],
  };
}
