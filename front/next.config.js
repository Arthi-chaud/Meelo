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
        source: '/libraries/:slug/artists',
        destination: '/artists',
      },
      {
        source: '/libraries/:slug/albums',
        destination: '/albums',
      },
      {
        source: '/libraries/:slug/songs',
        destination: '/songs',
      },
    ]
  },
}