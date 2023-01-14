/** @type {import('next').NextConfig} */

module.exports = {
  reactStrictMode: false,
  swcMinify: true,
  env: {
    ssrApiRoute: 'http://localhost:4000'
  },
  images: {
    deviceSizes: [500, 720, 1280, 1920],
    imageSizes: [50, 100, 250, 300, 500, 1000],
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