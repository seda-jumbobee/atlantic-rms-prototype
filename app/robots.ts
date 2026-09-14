import type { MetadataRoute } from "next";

// A metadata route is a route handler, and `output: export` will not emit one
// unless it is declared static. The rules never vary per request, so pinning
// this writes robots.txt into the exported files at build time.
export const dynamic = "force-static";

// Demo prototype — keep fully out of search indexes.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
