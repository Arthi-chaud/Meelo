/** @type {import('next').NextConfig} */

const config = {
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
}

if (process.env.NODE_ENV !== "production") {
	config.rewrites = async () => [
		{
			source: "/api/:path*",
			destination: process.env.SSR_SERVER_URL
				? `${process.env.SSR_SERVER_URL}/:path*`
				: "/api/:path*",
		},
	];
}

module.exports = config;