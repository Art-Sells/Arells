/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/analytics-internal', destination: '/metrics', permanent: true },
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

    // Server-only: Amplify often omits custom env from the API Lambda at runtime, but the bucket name is present
    // during `next build`. Inlining `S3_BUCKET_NAME` avoids any NEXT_PUBLIC_* hack; client bundles do not use this plugin.
    if (isServer) {
      const bucket =
        process.env.S3_BUCKET_NAME?.trim() ||
        process.env.AWS_S3_BUCKET?.trim() ||
        process.env.S3_BUCKET?.trim();
      if (bucket) {
        config.plugins.push(
          new webpack.DefinePlugin({
            'process.env.S3_BUCKET_NAME': JSON.stringify(bucket),
          })
        );
      }
    }

    return config;
  },
};

export default nextConfig;