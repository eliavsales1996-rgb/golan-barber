import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.120'],
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
