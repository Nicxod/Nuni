import type { NextConfig } from "next";

const apiBackendUrl =
  process.env.API_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BACKEND_URL ||
  "http://localhost:8001";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiBackendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
