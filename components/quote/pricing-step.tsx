"use client";

import type { ReactNode } from "react";
import {
  ClipboardCheck, Truck, Forklift, Warehouse, Ship, MapPin, ArrowRight, Save,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChargeTable } from "@/components/quote/charge-table";
import { useIsAdmin } from "@/components/session-provider";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CARRIERS } from "@/lib/data/carriers";
import { VENDORS, DATA_SOURCES } from "@/lib/data/vendors";
import {
  PricingModeSelector, PricingSummaryCard, ServiceProfitControls,
  type PricingModel, type QuoteMeta,
} from "@/components/quote/pricing-parts";
import type { LegKind, ChargeLine } from "@/lib/types";

const LEG_ICON: Record<LegKind, typeof Truck> = {
  preparation: ClipboardCheck, inland: Truck, loading: Forklift, cfs: Warehouse, drayage: Truck, ocean: Ship, oncarriage: MapPin,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}

// ── one service (leg) ──
function ServiceCard({ leg, model, editableCosts }: { leg: PricingModel["legs"][number]; model: PricingModel; editableCosts: boolean }) {
  const isAdmin = useIsAdmin();
  const Icon = LEG_ICON[leg.kind];
  const cost = model.calc.legCost[leg.id] ?? 0;

  const patch = (p: Partial<typeof leg>) => model.setLegs((ls) => ls.map((l) => (l.id === leg.id ? { ...l, ...p } : l)));
  const setCharges = (charges: ChargeLine[]) => patch({ charges });

  return (
    <Card className={cn("gap-0 overflow-hidden p-0", !leg.included && "opacity-70")}>
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></div>
          <div className="min-w-0">
            <div className="truncate font-medium">{leg.title}</div>
            <div className="truncate text-xs text-muted-foreground">{leg.from} → {leg.to}</div>
          </div>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-xs font-medium text-muted-foreground">
          Include in quote
          <Switch checked={leg.included} onCheckedChange={(v) => patch({ included: v })} aria-label={`Include ${leg.title} in quote`} />
        </label>
      </div>

      {leg.included ? (
        <div className="space-y-3 px-4 pb-4">
          {editableCosts ? (
            <>
              {/* sourcing (internal) */}
              <div className="grid gap-2 sm:grid-cols-2">
                {leg.kind === "ocean" ? (
                  <Field label="Carrier">
                    <Select value={leg.carrierId} onValueChange={(v) => patch({ carrierId: v })}>
                      <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{CARRIERS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                ) : (
                  <Field label="Vendor">
                    <Select value={leg.vendorId} onValueChange={(v) => patch({ vendorId: v })}>
                      <SelectTrigger size="sm"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                      <SelectContent>{VENDORS.map((v) => <SelectItem key={v.id} value={v.id}>{v.name} · T{v.tier}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                )}
                {isAdmin && (
                  <Field label="Rate source">
                    <Select value={leg.dataSourceId} onValueChange={(v) => patch({ dataSourceId: v })}>
                      <SelectTrigger size="sm"><SelectValue placeholder="Rate source" /></SelectTrigger>
                      <SelectContent>{DATA_SOURCES.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                )}
              </div>
              {model.mode === "service" && <ServiceProfitControls model={model} legId={leg.id} />}
              {/* internal cost breakdown — the service subtotal shows here once */}
              <ChargeTable charges={leg.charges} onChange={setCharges} />
            </>
          ) : (
            <>
              {/* read-only internal cost (already set in Build route) */}
              <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Internal cost</span>
                <span className="font-semibold tabular-nums">{money(cost)}</span>
              </div>
              {model.mode === "service" && <ServiceProfitControls model={model} legId={leg.id} />}
            </>
          )}
        </div>
      ) : (
        <div className="border-t px-4 py-3 text-sm text-muted-foreground">Not included in this quote.</div>
      )}
    </Card>
  );
}

export function PricingStep({
  model, meta, summary, onReview, editableCosts = true, servicesLabel = "Services",
}: {
  model: PricingModel;
  meta: QuoteMeta;
  /** Top context card — the selected rate (Rate Quote) or the route summary (Custom Route). */
  summary: ReactNode;
  onReview: () => void;
  editableCosts?: boolean;
  servicesLabel?: string;
}) {
  const { calc } = model;
  const hasServices = calc.included.length > 0;

  return (
    <div className="space-y-5">
      {summary}

      <PricingModeSelector model={model} />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* left: services */}
        <div className="min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{servicesLabel}</h3>
            <span className="text-xs text-muted-foreground">{calc.included.length} of {model.legs.length} included</span>
          </div>
          {model.legs.map((leg) => <ServiceCard key={leg.id} leg={leg} model={model} editableCosts={editableCosts} />)}
        </div>

        {/* right: pricing summary */}
        <div className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
          <PricingSummaryCard model={model} />
        </div>
      </div>

      {/* sticky action bar */}
      <div className="sticky bottom-4 z-10">
        <Card className="flex flex-row flex-wrap items-center justify-between gap-3 p-3 shadow-lg">
          <div className="text-sm">
            <span className="text-muted-foreground">Client price</span>{" "}
            <span className="font-semibold tabular-nums">{money(calc.clientPrice)}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => toast.success("Draft saved", { description: `${meta.quoteId} · ${meta.origin} → ${meta.destination} saved to history.` })}
            >
              <Save className="size-4" /> Save draft
            </Button>
            <Button size="sm" className="gap-1.5" onClick={onReview} disabled={!hasServices}>
              Review quote <ArrowRight className="size-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
