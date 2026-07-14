import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.istockphoto.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Enable modern image formats
    formats: ['image/avif', 'image/webp'],
    // Minimize image payload sizes
    minimumCacheTTL: 60,
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes for optimized loading
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Performance optimizations
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react', 'react-hot-toast'],
  },

  // Packages that must run on Node.js, not bundled by webpack.
  // Prevents "cannot be used in an Edge Runtime" errors on Vercel.
  serverExternalPackages: ['mongoose', 'mongodb', 'nodemailer', 'bcryptjs', 'jsonwebtoken'],

  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Enable compression
  compress: true,

  // Power by header removal for security
  poweredByHeader: false,

  // Strict mode for development
  reactStrictMode: true,

  // Generate ETags for caching
  generateEtags: true,
};

export default nextConfig;
