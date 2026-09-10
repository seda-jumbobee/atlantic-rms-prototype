import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-only overlay badge sits bottom-left, exactly where the account
  // block now lives, and covers it during local review. Production builds
  // never render it, so turning it off only affects `npm run dev`.
  devIndicators: false,
};

export default nextConfig;
