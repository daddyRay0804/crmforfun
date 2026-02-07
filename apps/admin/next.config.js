/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Proxy API calls through Next.js so the browser can use same-origin requests.
    // In docker-compose, the API service is reachable via hostname `api`.
    return [
      {
        source: '/api/:path*',
        destination: 'http://api:3001/:path*',
      },
    ];
  },
};
module.exports = nextConfig;
