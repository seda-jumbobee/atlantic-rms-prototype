"use client";

import { getAddress, getPort } from "@/lib/data/ports";
import { cn } from "@/lib/utils";

/* ============================================================================
   How a place is drawn — the one way a port or an address is named anywhere in
   the product. The country is carried by its flag rather than a generic
   anchor/pin glyph.

   Three consequences the API has to answer for:

     • A flag is a picture of a COUNTRY, not of a KIND of place, so the
       port-vs-address distinction the glyph used to carry is restated in
       text: ports keep their UN/LOCODE beside the name, and `kind` adds a
       screen-reader word. Nothing is left to the picture alone.

     • Place and country are separate fields, never one joined string. They
       are set in different weights — the place regular, the country medium —
       so a reader scanning a column of "…, United States" can find the row
       by its country without the place names shouting over it.

     • Regional-indicator pairs have no glyph on Windows — the browser falls
       back to the two letters ("US"). Degraded, not wrong: the country is
       spelled out beside it either way. The fixed-width box keeps rows
       aligned under both renderings.
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
  /** The place itself — a port/city name, or a street line. */
  name: string;
  /** Country, where the record names one separately from `name`. */
  country?: string;
  countryCode?: string;
  /** UN/LOCODE — ports only. */
  code?: string;
}

/** The name as one plain string, for a tooltip or an aria-label. */
export function locationText(point: LocationPoint): string {
  return point.country ? `${point.name}, ${point.country}` : point.name;
}

/** Inline content, so the caller's own span owns truncation and layout.
    The place reads at regular weight and its country at medium. */
export function LocationName({ point, className }: { point: LocationPoint; className?: string }) {
  return (
    <span className={cn("font-normal", className)}>
      {point.name}
      {point.country && (
        <>
          {", "}
          <span className="font-medium">{point.country}</span>
        </>
      )}
    </span>
  );
}

function fromPortId(portId?: string): LocationPoint | null {
  const p = getPort(portId);
  return p
    ? { kind: "port", name: p.name, country: p.country, countryCode: p.countryCode, code: p.locode }
    : null;
}

function fromAddressId(addressId?: string): LocationPoint | null {
  const a = getAddress(addressId);
  // The city, not the street line: this is the form a route summary shows,
  // where the lane matters and the doorstep does not.
  return a
    ? { kind: "address", name: a.city || a.label, country: a.country, countryCode: a.countryCode }
    : null;
}

/** Resolve an origin/destination end — exactly one of the two ids is set. */
export function resolveLocationPoint(portId?: string, addressId?: string): LocationPoint | null {
  return fromPortId(portId) ?? fromAddressId(addressId);
}

/** Resolve a picked location (kind + id) into its summary form. */
export function locationPoint(kind: "port" | "address", id: string): LocationPoint | null {
  return kind === "port" ? fromPortId(id) : fromAddressId(id);
}

export function LocationLabel({
  point,
  showCode = true,
  className,
  flagClassName,
}: {
  point: LocationPoint;
  showCode?: boolean;
  className?: string;
  flagClassName?: string;
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-1.5", className)}>
      <CountryFlag cc={point.countryCode} className={flagClassName} />
      <span className="sr-only">{point.kind === "port" ? "Port:" : "Address:"}</span>
      {/* The LOCODE sits INSIDE the truncating span: where space runs out it
          should be the first thing dropped, not compete with the name. That
          makes it an inline run rather than a flex item, so the gap before it
          has to be a real space — a margin alone is invisible to a screen
          reader and to anyone copying the row, who would get "…StatesUSHOU". */}
      <span className="min-w-0 truncate">
        <LocationName point={point} />
        {showCode && point.code && (
          <>
            {" "}
            <span className="ml-0.5 font-mono text-caption text-muted-foreground">{point.code}</span>
          </>
        )}
      </span>
    </span>
  );
}
