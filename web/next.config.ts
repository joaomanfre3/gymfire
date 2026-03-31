import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg', '@prisma/client', '@prisma/adapter-pg', 'bcryptjs', 'jsonwebtoken'],
};

export default nextConfig;
