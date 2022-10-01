/** @type {import('next').NextConfig} */

module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    ssrApiRoute: 'http://localhost:4000'
  },
  images: {
    unoptimized: true,
  },
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