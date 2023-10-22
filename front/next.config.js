/** @type {import('next').NextConfig} */

module.exports = {
  reactStrictMode: false,
  swcMinify: true,
  env: {
    ssrApiRoute: 'http://localhost:4000'
  },
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