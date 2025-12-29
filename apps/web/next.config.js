/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Performance optimizations
  swcMinify: true,
  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
};

module.exports = nextConfig;
