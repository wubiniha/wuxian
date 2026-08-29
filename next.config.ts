import type { NextConfig } from 'next';

const nextConfig: NextConfig = { basePath: process.env.APP_BASE_PATH ?? '', env: { NEXT_PUBLIC_APP_BASE_PATH: process.env.APP_BASE_PATH ?? '' } };

export default nextConfig;
