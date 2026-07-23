"use client";

import {
  ClipboardCheck, Truck, Forklift, Warehouse, Ship, MapPin, Calculator,
  ArrowRight, Save, Info, Layers, Boxes,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChargeTable } from "@/components/quote/charge-table";
import { CarrierLogo } from "@/components/carrier-logo";
import { SourceBadge } from "@/components/status-badge";
import { useIsAdmin } from "@/components/session-provider";
import { money, fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CARRIERS } from "@/lib/data/carriers";
import { VENDORS, DATA_SOURCES } from "@/lib/data/vendors";
import {
  METHOD_LABEL, METHOD_TOOLTIP, METHOD_UNIT, equivalents,
  DEFAULT_SERVICE_METHOD, DEFAULT_SERVICE_VALUE,
  type PricingMethod,
} from "@/lib/pricing";
import type { QuotePricingContext, PricingModel } from "@/components/quote/quote-pricing-flow";
import type { LegKind, ChargeLine } from "@/lib/types";

const LEG_ICON: Record<LegKind, typeof Truck> = {
  preparation: ClipboardCheck, inland: Truck, loading: Forklift, cfs: Warehouse, drayage: Truck, ocean: Ship, oncarriage: MapPin,
};

const METHODS: PricingMethod[] = ["fixed", "markup", "margin"];

/** Round to at most one decimal and drop a trailing ".0". */
function pct(n: number): string {
  const r = Math.round(n * 10) / 10;
  return (Number.isInteger(r) ? r.toFixed(0) : r.toFixed(1)) + "%";
}

// ── profit method + value control (shared by whole-quote and per-service) ──
function MethodControls({
  method, value, onMethod, onValue, idBase,
}: {
  method: PricingMethod;
  value: number;
  onMethod: (m: PricingMethod) => void;
  onValue: (v: number) => void;
  idBase: string;
}) {
  const unit = METHOD_UNIT[method];
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Pricing method</Label>
      </div>
      <div className="grid grid-cols-3 gap-1 rounded-md border p-0.5">
        {METHODS.map((m) => (
          <Tooltip key={m}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onMethod(m)}
                aria-pressed={method === m}
                className={cn(
                  "rounded px-2 py-1.5 text-xs font-medium transition",
                  method === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {METHOD_LABEL[m]}
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-56">{METHOD_TOOLTIP[m]}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div className="relative">
        {unit === "$" && (
          <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-muted-foreground">$</span>
        )}
        <Input
          id={`${idBase}-value`}
          type="number"
          min={0}
          inputMode="numeric"
          value={value}
          onChange={(e) => onValue(Number(e.target.value))}
          className={cn(
            "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none",
            unit === "$" ? "pl-5" : "pr-7",
          )}
          aria-label={`${METHOD_LABEL[method]} value`}
        />
        {unit === "%" && (
          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-muted-foreground">%</span>
        )}
      </div>
    </div>
  );
}

function Equivalents({ cost, profit }: { cost: number; profit: number }) {
  const eq = equivalents(cost, profit);
  return (
    <p className="text-caption text-muted-foreground">
      Profit <span className="font-medium text-foreground">{money(eq.profit)}</span> ·{" "}
      {pct(eq.markupPct)} markup · {pct(eq.marginPct)} margin
    </p>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}

// ── one service (leg) ──
function ServiceCard({ leg, model }: { leg: PricingModel["legs"][number]; model: PricingModel }) {
  const isAdmin = useIsAdmin();
  const Icon = LEG_ICON[leg.kind];
  const cost = model.calc.legCost[leg.id] ?? 0;
  const method = model.serviceMethod[leg.id] ?? DEFAULT_SERVICE_METHOD;
  const value = model.serviceValue[leg.id] ?? DEFAULT_SERVICE_VALUE;
  const profit = model.calc.legProfit[leg.id] ?? 0;
  const clientAmt = model.calc.clientLegAmount[leg.id] ?? 0;

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

          {/* per-service profit (only in "Price by service" mode) */}
          {model.mode === "service" && (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <MethodControls
                idBase={`svc-${leg.id}`}
                method={method}
                value={value}
                onMethod={(m) => model.setServiceMethod(leg.id, m)}
                onValue={(v) => model.setServiceValue(leg.id, v)}
              />
              <Equivalents cost={cost} profit={profit} />
              <div className="flex items-center justify-between border-t pt-2 text-sm">
                <span className="text-muted-foreground">Client price for this service</span>
                <span className="font-semibold tabular-nums">{money(clientAmt)}</span>
              </div>
            </div>
          )}

          {/* internal cost breakdown — the service subtotal shows here once */}
          <ChargeTable charges={leg.charges} onChange={setCharges} />
        </div>
      ) : (
        <div className="border-t px-4 py-3 text-sm text-muted-foreground">Not included in this quote.</div>
      )}
    </Card>
  );
}

export function PricingStep({
  model, onReview, rate, quoteId, origin, destination,
}: QuotePricingContext & { model: PricingModel; onReview: () => void }) {
  const { calc } = model;
  const hasServices = calc.included.length > 0;

  return (
    <div className="space-y-5">
      {/* Selected rate summary */}
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="text-caption font-medium uppercase tracking-wide text-muted-foreground">Selected rate</div>
          <div className="flex flex-wrap items-center gap-2">
            <CarrierLogo carrierId={rate.carrierId} showName />
            <SourceBadge source={rate.sourceType} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            <span>{rate.transitDays} days transit</span>
            <span>Valid to {fmtDate(rate.validTo)}</span>
            {rate.contractNo && <span>Contract <span className="font-mono text-foreground">{rate.contractNo}</span></span>}
          </div>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <div className="text-caption uppercase tracking-wide text-muted-foreground">Internal cost</div>
          <div className="text-xl font-bold tabular-nums">{money(calc.internalCost)}</div>
          <div className="text-caption text-muted-foreground">Before profit · {rate.currency}</div>
        </div>
      </Card>

      {/* Pricing mode */}
      <Card className="space-y-3 p-4">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <Calculator className="size-4 text-primary" /> How do you want to price this quote?
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {([
            { m: "whole", icon: Layers, title: "Price entire quote", desc: "One profit setting across the whole shipment." },
            { m: "service", icon: Boxes, title: "Price by service", desc: "Set profit on each service separately." },
          ] as const).map(({ m, icon: MIcon, title, desc }) => (
            <button
              key={m}
              type="button"
              onClick={() => model.setMode(m)}
              aria-pressed={model.mode === m}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left transition",
                model.mode === m ? "border-primary bg-primary/[0.04] ring-1 ring-primary/30" : "hover:bg-muted/50",
              )}
            >
              <div className={cn("grid size-8 shrink-0 place-items-center rounded-lg", model.mode === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                <MIcon className="size-4" />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-medium">{title}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* left: services */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Services</h3>
            <span className="text-xs text-muted-foreground">{calc.included.length} of {model.legs.length} included</span>
          </div>
          {model.legs.map((leg) => <ServiceCard key={leg.id} leg={leg} model={model} />)}
        </div>

        {/* right: pricing summary */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="space-y-3 p-4">
            <div className="text-sm font-semibold">Quote pricing</div>

            {/* Internal cost + Profit = Client price */}
            <dl className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Internal cost</dt>
                <dd className="tabular-nums">{money(calc.internalCost)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  Profit
                  {calc.clientPrice > 0 && (
                    <Badge variant="status-positive" className="h-4 px-1.5 text-[10px]">{pct(calc.marginPct)} margin</Badge>
                  )}
                </dt>
                <dd className="tabular-nums text-status-positive-fg">+{money(calc.profit)}</dd>
              </div>
              <Separator />
              <div className="flex items-end justify-between">
                <dt className="font-medium">Client price</dt>
                <dd className="text-2xl font-bold tabular-nums text-primary">{money(calc.clientPrice)}</dd>
              </div>
            </dl>

            {model.mode === "whole" ? (
              <>
                <Separator />
                <MethodControls
                  idBase="whole"
                  method={model.wholeMethod}
                  value={model.wholeValue}
                  onMethod={model.setWholeMethod}
                  onValue={model.setWholeValue}
                />
                <Equivalents cost={calc.internalCost} profit={calc.profit} />
              </>
            ) : (
              <p className="flex items-start gap-1.5 rounded-md bg-muted/40 p-2 text-caption text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
                Profit is set on each service on the left. This total is the sum of every included service.
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* sticky action bar */}
      <div className="sticky bottom-4 z-10">
        <Card className="flex items-center justify-between gap-3 p-3 shadow-lg">
          <div className="text-sm">
            <span className="text-muted-foreground">Client price</span>{" "}
            <span className="font-semibold tabular-nums">{money(calc.clientPrice)}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => toast.success("Draft saved", { description: `${quoteId} · ${origin} → ${destination} saved to history.` })}
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
