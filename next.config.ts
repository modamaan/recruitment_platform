import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Note: Turbopack watchOptions only supports pollIntervalMs, not ignored paths.
  // The backend folder is excluded via Next.js not traversing outside app/.
  async redirects() {
    return [
      {
        source: "/dashboard/placement_cell",
        destination: "/dashboard/placement-cell",
        permanent: false,
      },
      {
        source: "/dashboard/placement_cell/:path*",
        destination: "/dashboard/placement-cell/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
