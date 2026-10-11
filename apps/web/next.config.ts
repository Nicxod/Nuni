import type { NextConfig } from "next";

const apiBackendUrl = process.env.API_BACKEND_URL;

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
    if (apiBackendUrl && !apiBackendUrl.includes("localhost")) {
      return [
        {
          source: "/api/v1/:path*",
          destination: `${apiBackendUrl}/api/v1/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
