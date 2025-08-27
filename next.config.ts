import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ❗ no detiene el build por errores de tipos
  typescript: {
    ignoreBuildErrors: true,
  },
  // ❗ no detiene el build por errores de eslint
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;