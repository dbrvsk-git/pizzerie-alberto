import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (lokální vývojová databáze) se nesmí bundlovat
  serverExternalPackages: ["@electric-sql/pglite"],
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
