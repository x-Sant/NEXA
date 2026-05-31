import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  experimental: {
    cpus: 2, // Limita o número de workers do Node.js para não lotar a RAM
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        // Aplica a todas as rotas
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://images.unsplash.com https://plus.unsplash.com; font-src 'self' data:; connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}; frame-src 'self' ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}; object-src 'self' ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'};`
          }
        ]
      }
    ]
  }
}

export default nextConfig
