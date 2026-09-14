/* ============================================================================
   Paths to files in public/.

   The app is served from a subdirectory on GitHub Pages, so every URL it emits
   needs that prefix. Next adds it on its own to <Link>, to router navigation,
   and to next/image — but to nothing that is written by hand. A plain
   <img src="/brand/logo.svg"> is sent to the browser exactly as typed, asks the
   server for /brand/logo.svg instead of /atlantic-rms-prototype/brand/logo.svg,
   and renders as a broken image. That is not a bug Next warns about: the build
   succeeds and the page looks fine locally, because locally there is no prefix.

   So every hand-written reference to something in public/ goes through asset().

   The prefix comes from next.config.ts, which pins NEXT_PUBLIC_BASE_PATH to the
   same value it gives basePath. Reading one source keeps the two from drifting —
   if they disagreed, every asset on the site would break at once.
   ========================================================================= */

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Resolve a root-relative path this app serves into a URL the browser can
 * actually fetch — a file in `public/`, or a route being opened outside the
 * router (`window.open`, a raw anchor), which Next would otherwise not prefix.
 *
 *   asset("/brand/calculator-64.svg")
 *     → "/atlantic-rms-prototype/brand/calculator-64.svg"  (GitHub Pages)
 *     → "/brand/calculator-64.svg"                          (served from root)
 *
 * Normal in-app navigation does NOT need this — `<Link>` and `router.push`
 * already apply the prefix, and passing a pre-prefixed href to them would
 * double it.
 *
 * Absolute URLs and data URIs are returned untouched, so a caller can pass a
 * field holding either without checking it first.
 */
export function asset(path: string): string {
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(path)) return path;
  return `${BASE_PATH}${path.startsWith("/") ? "" : "/"}${path}`;
}
