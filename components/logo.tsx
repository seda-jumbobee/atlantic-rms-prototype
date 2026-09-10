import { cn } from "@/lib/utils";

/* ============================================================================
   RMS logo — Figma "04 - Screens / Dashboard".

   The mark is the exported Figma calculator asset, the same one the
   authentication banner uses. It is never redrawn or substituted for a
   lookalike icon: `/brand/calculator-64.svg` is the artwork.

   The wordmark is the short form, "RMS". The long "Atlantic RMS / Rate
   Management" lockup was replaced in the Dashboard reference.
   ========================================================================= */

export function LogoMark({
  size,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const px = size ?? 40;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local static SVG; next/image adds nothing
    <img
      src="/brand/calculator-64.svg"
      alt=""
      aria-hidden
      width={px}
      height={px}
      // Inline only when a size is asked for, so callers passing a `size-*`
      // utility (the PDF header, the loading state) still win.
      style={size === undefined ? undefined : { width: size, height: size }}
      className={cn("shrink-0 select-none", className)}
    />
  );
}

/**
 * Sidebar lockup. `collapsed` drops the wordmark and leaves the mark centred
 * in the icon rail — the same asset at the same size, so nothing shifts.
 */
export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <span
      className={cn(
        "flex items-center gap-2.5",
        // Collapsed, the mark centres on a 48px box so it shares an axis with
        // the icon rail below it rather than centring on the wider rail.
        collapsed && "w-12 justify-center gap-0"
      )}
    >
      <LogoMark size={40} />
      <span className="sr-only">Atlantic Rate Management System</span>
      {!collapsed && (
        <span aria-hidden className="text-base font-bold tracking-tight text-foreground">
          RMS
        </span>
      )}
    </span>
  );
}
