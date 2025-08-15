/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions are now stable and enabled by default
  // experimental: { serverActions: true }, // Remove this line
  
  // Suppress hydration warnings from browser extensions like Grammarly
  reactStrictMode: true,
  
  // Improve hot reload performance
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Optimize for development hot reload
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
  
  // Reduce unnecessary recompilations
  experimental: {
    optimizePackageImports: ['@mui/icons-material', '@mui/material'],
  },
};
export default nextConfig;
