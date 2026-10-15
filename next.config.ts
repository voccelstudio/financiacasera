import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* La app es 100% dinámica (datos por sesión): no usamos cacheComponents */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
