import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // The dashboard reads use-case manifests and the shared-resource catalog from
  // disk, so they must be traced into the standalone bundle.
  outputFileTracingIncludes: {
    "/": ["./use-cases/*/usecase.json", "./shared-resources/resources.json"],
    "/use-cases/[slug]": ["./use-cases/*/usecase.json"],
  },
};

export default nextConfig;
