/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/analytics-internal', destination: '/metrics', permanent: true },
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

      if (Object.keys(defs).length > 0) {
        config.plugins.push(new webpack.DefinePlugin(defs));
      }
    }

    return config;
  },
};

export default nextConfig;