/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pack Bitcoin alien compose JPEGs into API Lambdas (Amplify otherwise ENOENT on /tmp/app/public/...).
  experimental: {
    outputFileTracingIncludes: {
      '/api/user/alien-compose': ['./src/server-data/alien-compose/**/*'],
      '/api/user/alien-generate': ['./src/server-data/alien-compose/**/*'],
      '/api/user/alien-videos': ['./src/server-data/alien-compose/**/*'],
    },
  },
  async redirects() {
    return [
      { source: '/analytics-internal', destination: '/metrics', permanent: true },
      { source: '/my-portfolio', destination: '/my-investments', permanent: true },
      { source: '/earn-money-weekly', destination: '/my-investments', permanent: true },
      { source: '/thebitcoinalienrace', destination: '/bitcoin', permanent: true },
      { source: '/thebitcoinalienrace/:date', destination: '/bitcoin', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/ArellsFavicon.ico',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, must-revalidate' }],
      },
      {
        source: '/ArellsIcon.png',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, must-revalidate' }],
      },
    ];
  },
  webpack: (config, { isServer, webpack }) => {
    config.experiments = {
      asyncWebAssembly: true,
      syncWebAssembly: true,
      layers: true,
    };

    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Server-only: Amplify often omits custom env from the API Lambda at runtime. Values present during `next build`
    // are inlined so S3, credentials, SES From addresses, and AUTH_JWT_SECRET match local behavior. Client bundles do not use this block.
    if (isServer) {
      const defs = {};

      const bucket =
        process.env.S3_BUCKET_NAME?.trim() ||
        process.env.AWS_S3_BUCKET?.trim() ||
        process.env.S3_BUCKET?.trim();
      if (bucket) {
        defs['process.env.S3_BUCKET_NAME'] = JSON.stringify(bucket);
      }

      const region =
        process.env.WS_REGION?.trim() ||
        process.env.AWS_REGION?.trim() ||
        process.env.AWS_DEFAULT_REGION?.trim();
      if (region) {
        defs['process.env.WS_REGION'] = JSON.stringify(region);
      }

      const accessKeyId =
        process.env.WS_ACCESS_KEY_ID?.trim() || process.env.AWS_ACCESS_KEY_ID?.trim();
      if (accessKeyId) {
        defs['process.env.WS_ACCESS_KEY_ID'] = JSON.stringify(accessKeyId);
      }

      const secretAccessKey =
        process.env.WS_SECRET_ACCESS_KEY?.trim() || process.env.AWS_SECRET_ACCESS_KEY?.trim();
      if (secretAccessKey) {
        defs['process.env.WS_SECRET_ACCESS_KEY'] = JSON.stringify(secretAccessKey);
      }

      const verifyEmailFrom = process.env.VERIFY_EMAIL_FROM?.trim();
      if (verifyEmailFrom) {
        defs['process.env.VERIFY_EMAIL_FROM'] = JSON.stringify(verifyEmailFrom);
      }
      const passwordResetFrom = process.env.PASSWORD_RESET_FROM?.trim();
      if (passwordResetFrom) {
        defs['process.env.PASSWORD_RESET_FROM'] = JSON.stringify(passwordResetFrom);
      }

      const authJwtSecret = process.env.AUTH_JWT_SECRET?.trim();
      if (authJwtSecret && authJwtSecret.length >= 16) {
        defs['process.env.AUTH_JWT_SECRET'] = JSON.stringify(authJwtSecret);
      }

      const massiveApiKey = process.env.MASSIVE_API_KEY?.trim();
      if (massiveApiKey) {
        defs['process.env.MASSIVE_API_KEY'] = JSON.stringify(massiveApiKey);
      }

      const coingeckoApiKey = process.env.COINGECKO_API_KEY?.trim();
      if (coingeckoApiKey) {
        defs['process.env.COINGECKO_API_KEY'] = JSON.stringify(coingeckoApiKey);
      }

      const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
      if (stripeSecretKey) {
        defs['process.env.STRIPE_SECRET_KEY'] = JSON.stringify(stripeSecretKey);
      }
      const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
      if (stripeWebhookSecret) {
        defs['process.env.STRIPE_WEBHOOK_SECRET'] = JSON.stringify(stripeWebhookSecret);
      }
      const stripePriceCg = process.env.STRIPE_PRICE_CHARACTER_GENERATION?.trim();
      if (stripePriceCg) {
        defs['process.env.STRIPE_PRICE_CHARACTER_GENERATION'] = JSON.stringify(stripePriceCg);
      }

      /* Character compose / loops — Amplify API Lambda often has no runtime env. */
      const grokApiKey =
        process.env.GROK_API_KEY?.trim() || process.env.XAI_API_KEY?.trim();
      if (grokApiKey) {
        defs['process.env.GROK_API_KEY'] = JSON.stringify(grokApiKey);
      }
      const grokImageModel = process.env.GROK_IMAGE_MODEL?.trim();
      if (grokImageModel) {
        defs['process.env.GROK_IMAGE_MODEL'] = JSON.stringify(grokImageModel);
      }
      const grokVideoModel = process.env.GROK_VIDEO_MODEL?.trim();
      if (grokVideoModel) {
        defs['process.env.GROK_VIDEO_MODEL'] = JSON.stringify(grokVideoModel);
      }
      const grokVideoResolution = process.env.GROK_VIDEO_RESOLUTION?.trim();
      if (grokVideoResolution) {
        defs['process.env.GROK_VIDEO_RESOLUTION'] = JSON.stringify(grokVideoResolution);
      }

      if (Object.keys(defs).length > 0) {
        config.plugins.push(new webpack.DefinePlugin(defs));
      }
    }

    return config;
  },
};

export default nextConfig;