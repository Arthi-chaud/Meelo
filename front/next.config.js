/** @type {import('next').NextConfig} */

module.exports = {
  output: 'standalone',
  reactStrictMode: false,
  swcMinify: true,
  async redirects() {
    return [
      {
        source: '/songs/:slug',
        destination: '/songs/:slug/lyrics',
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return []
  },
}