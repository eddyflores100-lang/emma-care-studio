import type { NextConfig } from "next";

/**
 * EXPORT_MODE=1 → build estático para GitHub Pages (emmacare.alicelabs.site).
 * Sin él, se usa el modo standalone normal del entorno de desarrollo.
 */
const isExport = process.env.EXPORT_MODE === "1";

const nextConfig: NextConfig = isExport
  ? {
      output: "export",
      distDir: ".next-export",
      images: { unoptimized: true },
      trailingSlash: true,
      typescript: { ignoreBuildErrors: true },
      reactStrictMode: false,
    }
  : {
      output: "standalone",
      typescript: { ignoreBuildErrors: true },
      reactStrictMode: false,
    };

export default nextConfig;
