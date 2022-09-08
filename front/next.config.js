/** @type {import('next').NextConfig} */

module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/albums',
        permanent: true,
      },
      {
        source: '/libraries/:slug',
        destination: '/libraries/:slug/albums',
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/libraries/:slug/:itemType(albums|artists|songs)',
        destination: '/:itemType',
      },
    ]
  },
}