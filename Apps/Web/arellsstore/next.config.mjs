/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Enable WebAssembly support and layers experiment
    config.experiments = {
      asyncWebAssembly: true,
      syncWebAssembly: true,
      layers: true, // Add this line to enable the layers experiment
    };

    // Ensure the wasm files are treated correctly
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    return config;
  },
};

export default nextConfig;