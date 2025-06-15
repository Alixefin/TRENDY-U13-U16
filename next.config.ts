import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'twgynskokbnvbfdjywuj.supabase.co', // Added Supabase hostname
        port: '',
        pathname: '/storage/v1/object/public/**', // Allow images from public storage buckets
      },
    ],
  },
};

export default nextConfig;
