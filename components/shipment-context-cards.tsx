"use client";

import { Card } from "@/components/ui/card";
import { LocationLabel, locationPoint } from "@/components/location-label";
import { MapPreview, type MapPoint } from "@/components/map-preview";
import type { LocationValue } from "@/components/location-combobox";
import { COMMODITY_KIND_LABEL, type CommoditySelection } from "@/components/commodity-picker";
import { PORTS, ADDRESSES } from "@/lib/data/ports";
import { CONTAINER_LABEL } from "@/lib/data/containers";
import { cn } from "@/lib/utils";

/* ============================================================================
   The context a shipping-details step shows beside its form: where the cargo
   is going, and what it is.

   Shared by Rate Quote step 1 and Custom Route step 1. The two flows ask for
   the same two facts first and differ only in what they do afterwards, so the
   answer to "what have I entered so far" should look identical in both — it
   lived inside the Rate Quote widget and Custom Route had grown its own,
   different, arrangement of the same information.
   ========================================================================= */

/** Both cards share one shell so they read as a pair: same caption, same
    inset, same rhythm. */
function ContextCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="gap-3 p-4">
      <h3 className="text-caption font-bold tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </Card>
  );
}

function shortLoc(v: LocationValue): string {
  return v.label.split("·")[0].split(",").slice(0, 2).join(",").trim();
}

/** The map needs coordinates, which only the source record has. */
export function mapPoint(v?: LocationValue): MapPoint | undefined {
  if (!v) return undefined;
  const rec = v.kind === "port" ? PORTS.find((p) => p.id === v.id) : ADDRESSES.find((a) => a.id === v.id);
  return rec ? { lat: rec.lat, lng: rec.lng, label: shortLoc(v) } : undefined;
}

/* A route reads DOWN a line, not across a two-column table. The ends are the
   same kind of thing, so they get the same treatment, and a marker and a rule
   say "from here to there" without an "Origin:" / "Destination:" label
   repeating what the shape already shows. */
function RouteEnd({ value, kind }: { value: LocationValue; kind: "from" | "to" }) {
  const point = locationPoint(value.kind, value.id);
  return (
    <li className="flex min-w-0 items-start gap-2.5">
      <span
        aria-hidden
        className={cn("mt-1.5 size-2 shrink-0 rounded-full", kind === "from" ? "bg-primary" : "bg-success")}
      />
      <span className="min-w-0 flex-1">
        <span className="sr-only">{kind === "from" ? "Origin: " : "Destination: "}</span>
        {point ? (
          <LocationLabel point={point} className="text-body" />
        ) : (
          <span className="block truncate text-body">{value.label}</span>
        )}
      </span>
    </li>
  );
}

export function RouteOverviewCard({ origin, dest }: { origin: LocationValue; dest: LocationValue }) {
  const o = mapPoint(origin);
  const d = mapPoint(dest);
  return (
    <ContextCard title="Route">
      <ol className="relative flex flex-col gap-2.5">
        <span aria-hidden className="absolute top-3 bottom-3 left-[3px] w-px bg-border-divider" />
        <RouteEnd value={origin} kind="from" />
        <RouteEnd value={dest} kind="to" />
      </ol>
      {o && d && <MapPreview origin={o} destination={d} className="h-32 rounded-lg" />}
    </ContextCard>
  );
}

export function CommodityDetailsCard({ commodity }: { commodity: CommoditySelection }) {
  const d = commodity.dimensions;
  const rows: [string, string][] = [];
  rows.push(["Type", COMMODITY_KIND_LABEL[commodity.kind]]);
  if (commodity.label) rows.push(["Item", commodity.label]);
  if (commodity.condition) rows.push(["Condition", commodity.condition === "operable" ? "Operable (self-propelled)" : "Non-operable"]);
  rows.push(["Loading method", commodity.shipmentType === "Flatrack" ? "Flat Rack" : commodity.shipmentType]);
  if (commodity.container) rows.push(["Container", CONTAINER_LABEL[commodity.container]]);
  if (d && (d.lengthIn || d.widthIn || d.heightIn)) rows.push(["Dimensions", `${d.lengthIn || "—"}″L × ${d.widthIn || "—"}″W × ${d.heightIn || "—"}″H`]);
  if (d?.weightLb) rows.push(["Weight", `${d.weightLb.toLocaleString()} lb`]);
  return (
    <ContextCard title="Commodity">
      {/* Label above value, in columns. A right-aligned value column forced the
          eye back and forth across a gap for every row; stacked pairs are read
          in one pass and wrap instead of truncating. */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {rows.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-caption text-muted-foreground">{k}</dt>
            <dd className="mt-0.5 text-body font-medium break-words text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
    </ContextCard>
  );
}
