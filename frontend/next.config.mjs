/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/_/backend/:path*',
          destination: 'http://localhost:5000/:path*',
        },
      ];
    }
    return [];
  },
  allowedDevOrigins: ['192.168.1.92', 'http://192.168.1.92:3000'],
  output: 'standalone',
};

export default nextConfig;
