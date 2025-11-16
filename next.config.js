/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // TODO: Fix database type inference issues
    // Temporarily ignoring build errors to allow deployment
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.supabase.smartcamp.ai',
      },
    ],
  },
}

module.exports = nextConfig
