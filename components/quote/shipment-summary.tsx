"use client";

import { ArrowRight, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { COMMODITY_KIND_LABEL } from "@/components/commodity-picker";
import { LocationLabel, resolveLocationPoint } from "@/components/location-label";
import { getEquipment } from "@/lib/data/equipment";
import { CONTAINER_LABEL } from "@/lib/data/containers";
import type { SearchInput } from "@/lib/quote-engine";

/** Compact route + commodity summary shown across Choose rate / Set pricing / Review & send
    so the Manager always knows which shipment they are quoting. */
export function ShipmentSummary({ input, onEdit }: { input: SearchInput; onEdit?: () => void }) {
  const origin = resolveLocationPoint(input.originPortId, input.originAddressId);
  const dest = resolveLocationPoint(input.destPortId, input.destAddressId);
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
            <h2 className="text-caption font-medium uppercase tracking-wide text-muted-foreground">Shipping summary</h2>
          </div>
          {/* Route */}
          <div className="flex flex-col gap-1.5 text-sm sm:flex-row sm:items-center sm:gap-2">
            {origin && <LocationLabel point={origin} />}
            <ArrowRight aria-hidden className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
            {dest && <LocationLabel point={dest} />}
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
            <Pencil className="size-3.5" /> Edit shipping details
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
