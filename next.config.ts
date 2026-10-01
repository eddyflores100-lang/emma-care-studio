import type { NextConfig } from "next";

/**
 * EXPORT_MODE=1 → build estático para GitHub Pages (emmacare.alicelabs.site).
 * Sin él, se usa el modo standalone normal del entorno de desarrollo.
 *
 * PAGES_BASE_PATH: cuando el sitio vive en un subpath (p. ej. el preview de
 * github.io/emma-care-studio) los assets necesitan basePath. Con el dominio
 * propio (emmacare.alicelabs.site) se sirve en la raíz: basta con quitar
 * la variable del workflow.
 */
const isExport = process.env.EXPORT_MODE === "1";
const basePath = process.env.PAGES_BASE_PATH || "";

const nextConfig: NextConfig = isExport
  ? {
      output: "export",
      distDir: ".next-export",
      images: { unoptimized: true },
      trailingSlash: true,
      basePath: basePath || undefined,
      typescript: { ignoreBuildErrors: true },
      reactStrictMode: false,
    }
  : {
      output: "standalone",
      typescript: { ignoreBuildErrors: true },
      reactStrictMode: false,
    };

export default nextConfig;
