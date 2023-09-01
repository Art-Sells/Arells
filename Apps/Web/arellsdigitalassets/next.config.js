/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig

//For hosted images in AWS (not Metadata images)
module.exports = {
    images: {
      domains: ['d2d7sp5ao0zph4.cloudfront.net'],
    },
  };