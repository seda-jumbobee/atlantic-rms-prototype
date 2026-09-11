"use client";

import { getAddress, getPort } from "@/lib/data/ports";
import { cn } from "@/lib/utils";

/* ============================================================================
   How a place is drawn — the one way a port or an address is named anywhere in
   the product. Replaces the anchor/pin glyph with the country's own flag.

   Two consequences the API has to answer for:

     • A flag is a picture of a COUNTRY, not of a KIND of place, so the
       port-vs-address distinction the glyph used to carry is restated in
       text: ports keep their UN/LOCODE beside the name, and `kind` adds a
       screen-reader word. Nothing is left to the picture alone.

     • Regional-indicator pairs have no glyph on Windows — the browser falls
       back to the two letters ("US"). Degraded, not wrong: the country is
       spelled out in the name right beside it either way. The fixed-width box
       keeps rows aligned under both renderings.
   ========================================================================= */

const REGIONAL_INDICATOR_A = 0x1f1e6;

/** ISO 3166-1 alpha-2 → its flag emoji. Null for anything that is not two
    ASCII letters, so bad data degrades to "no flag" rather than to mojibake. */
export function countryFlag(cc?: string | null): string | null {
  if (!cc || !/^[A-Za-z]{2}$/.test(cc)) return null;
  return String.fromCodePoint(
    ...[...cc.toUpperCase()].map((c) => REGIONAL_INDICATOR_A + c.charCodeAt(0) - 65),
  );
}

/** The weight a location name carries. Exported so surfaces that must render
    the name themselves — the combobox needs its own truncating tooltip span —
    still get it from here rather than hand-picking a weight. */
export const LOCATION_NAME_CLASS = "font-bold text-foreground";

export function CountryFlag({ cc, className }: { cc?: string | null; className?: string }) {
  const flag = countryFlag(cc);
  if (!flag) return null;
  return (
    <span
      aria-hidden
      // A fixed box so names line up down a list whether the platform draws a
      // flag or the two-letter fallback.
      className={cn("inline-block w-[1.35em] shrink-0 text-center text-base leading-none", className)}
    >
      {flag}
    </span>
  );
}

export interface LocationPoint {
  kind: "port" | "address";
  /** The full display name, already including the country where there is one. */
  name: string;
  countryCode?: string;
  /** UN/LOCODE — ports only. */
  code?: string;
}

function fromPortId(portId?: string): LocationPoint | null {
  const p = getPort(portId);
  return p
    ? { kind: "port", name: `${p.name}, ${p.country}`, countryCode: p.countryCode, code: p.locode }
    : null;
}

function fromAddressId(addressId?: string): LocationPoint | null {
  const a = getAddress(addressId);
  if (!a) return null;
  return {
    kind: "address",
    name: a.city ? `${a.city}, ${a.country}` : a.label,
    countryCode: a.countryCode,
  };
}

/** Resolve an origin/destination end — exactly one of the two ids is set. */
export function resolveLocationPoint(portId?: string, addressId?: string): LocationPoint | null {
  return fromPortId(portId) ?? fromAddressId(addressId);
}

/** Resolve a picked `LocationValue` (kind + id) from the combobox. */
export function locationPoint(kind: "port" | "address", id: string): LocationPoint | null {
  return kind === "port" ? fromPortId(id) : fromAddressId(id);
}

export function LocationLabel({
  point,
  /** Override the resolved name — the combobox stores its own composed label. */
  name,
  showCode = true,
  className,
  flagClassName,
}: {
  point: LocationPoint;
  name?: string;
  showCode?: boolean;
  className?: string;
  flagClassName?: string;
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-1.5", className)}>
      <CountryFlag cc={point.countryCode} className={flagClassName} />
      <span className="sr-only">{point.kind === "port" ? "Port:" : "Address:"}</span>
      <span className={cn("truncate", LOCATION_NAME_CLASS)}>{name ?? point.name}</span>
      {showCode && point.code && (
        <span className="shrink-0 font-mono text-caption text-muted-foreground">{point.code}</span>
      )}
    </span>
  );
}
