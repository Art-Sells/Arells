/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.experiments = {
      asyncWebAssembly: true,
      syncWebAssembly: true,
      layers: true,
    };

    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `https://pro-api.coingecko.com/api/v3/:path*`,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_KRAKEN_API_KEY: process.env.NEXT_PUBLIC_KRAKEN_API_KEY,
    NEXT_PUBLIC_KRAKEN_API_SECRET: process.env.NEXT_PUBLIC_KRAKEN_API_SECRET,
  },
};

export default nextConfig;