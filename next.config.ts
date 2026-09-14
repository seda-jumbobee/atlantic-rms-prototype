import type { NextConfig } from "next";

/* ============================================================================
   Static export, published to GitHub Pages.

   Nothing in this prototype needs a server: no route handlers, no server
   actions, no data fetching — every record is a module in lib/data and every
   piece of state lives in the browser. So the whole app pre-renders to files,
   which is why it can be hosted for free on Pages rather than needing a
   platform that runs Node.

   basePath is required because Pages serves a project site from a
   subdirectory. Next rewrites <Link> and router destinations through it
   automatically; anything that hand-writes a URL would not be, so keep URLs
   going through the router.

   It is overridable so the same config still works on a host that serves from
   the root — set NEXT_PUBLIC_BASE_PATH="" there.
   ========================================================================= */

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/atlantic-rms-prototype";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // Pages has no image optimizer, so images are served as authored. Every
  // image here is either an inline SVG logo or a data URL, so nothing is lost.
  images: { unoptimized: true },
  // Emits each route as a directory with index.html, which is what a plain
  // static file server needs to resolve /admin/vendors without a rewrite rule.
  trailingSlash: true,

  // Next prefixes <Link>, router navigation and next/image with basePath, but
  // leaves every hand-written URL alone — so a plain <img src="/brand/x.svg">
  // would 404 on Pages. lib/asset.ts prefixes those, and reads this. Pinning it
  // here rather than letting it fall back separately means the two cannot
  // disagree: if they did, every image on the site would break at once.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },

  // The dev-only overlay badge sits bottom-left, exactly where the account
  // block now lives, and covers it during local review. Production builds
  // never render it, so turning it off only affects `npm run dev`.
  devIndicators: false,
};

export default nextConfig;
