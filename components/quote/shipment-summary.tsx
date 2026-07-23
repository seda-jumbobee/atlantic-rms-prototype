"use client";

import { Anchor, MapPin, ArrowRight, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { COMMODITY_KIND_LABEL } from "@/components/commodity-picker";
import { getPort, getAddress } from "@/lib/data/ports";
import { getEquipment } from "@/lib/data/equipment";
import { CONTAINER_LABEL } from "@/lib/data/containers";
import type { SearchInput } from "@/lib/quote-engine";

function flag(cc?: string): string | null {
  if (!cc || cc.length !== 2) return null;
  return String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** Resolve an origin/destination end into a display object. */
function resolveEnd(portId?: string, addrId?: string) {
  const p = getPort(portId);
  if (p) return { kind: "port" as const, name: `${p.name}, ${p.country}`, cc: p.countryCode, code: p.locode };
  const a = getAddress(addrId);
  if (a) return { kind: "address" as const, name: a.city ? `${a.city}, ${a.country}` : a.label, cc: a.countryCode, code: undefined };
  return null;
}

function End({ end }: { end: NonNullable<ReturnType<typeof resolveEnd>> }) {
  const Icon = end.kind === "port" ? Anchor : MapPin;
  const f = flag(end.cc);
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <Icon aria-hidden className="size-4 shrink-0 text-primary" />
      {f && <span aria-hidden className="shrink-0 text-sm leading-none">{f}</span>}
      <span className="truncate font-medium">{end.name}</span>
      {end.code && <span className="shrink-0 font-mono text-caption text-muted-foreground">{end.code}</span>}
    </span>
  );
}

/** Compact route + commodity summary shown across Choose rate / Set pricing / Review & send
    so the Manager always knows which shipment they are quoting. */
export function ShipmentSummary({ input, onEdit }: { input: SearchInput; onEdit?: () => void }) {
  const origin = resolveEnd(input.originPortId, input.originAddressId);
  const dest = resolveEnd(input.destPortId, input.destAddressId);
  const eq = getEquipment(input.equipmentId);
  const item = eq ? `${eq.make} ${eq.model}` : input.commodityLabel || undefined;

  const facts: { label: string; value: string }[] = [];
  facts.push({ label: "Commodity", value: COMMODITY_KIND_LABEL[input.commodityKind] });
  if (item) facts.push({ label: "Item", value: item });
  if (input.condition) facts.push({ label: "Condition", value: input.condition === "operable" ? "Operable" : "Non-operable" });
  facts.push({ label: "Loading", value: input.shipmentType === "Flatrack" ? "Flat Rack" : input.shipmentType });
  if (input.container) facts.push({ label: "Container", value: CONTAINER_LABEL[input.container] });

  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-caption font-medium uppercase tracking-wide text-muted-foreground">Shipment summary</h2>
          </div>
          {/* Route */}
          <div className="flex flex-col gap-1.5 text-sm sm:flex-row sm:items-center sm:gap-2">
            {origin && <End end={origin} />}
            <ArrowRight aria-hidden className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
            {dest && <End end={dest} />}
          </div>
          {/* Commodity facts */}
          <dl className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            {facts.map((f) => (
              <div key={f.label} className="flex items-center gap-1">
                <dt>{f.label}:</dt>
                <dd className="font-medium text-foreground">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="shrink-0 gap-1.5 self-start text-muted-foreground hover:text-foreground sm:self-center"
          >
            <Pencil className="size-3.5" /> Edit shipment details
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
