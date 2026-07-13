import type { MetadataRoute } from "next";

// Demo prototype — keep fully out of search indexes.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
