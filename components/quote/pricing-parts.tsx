"use client";

// Shared pricing UI + model for the quote flows (Rate Quote and Custom Route).
// The math lives in lib/pricing; this file holds the React state model and the
// presentational controls both flows reuse so pricing looks and behaves the same.

import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Calculator, Info, Layers, Boxes } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  computePricing, equivalents,
  METHOD_LABEL, METHOD_TOOLTIP, METHOD_UNIT,
  DEFAULT_SERVICE_METHOD, DEFAULT_SERVICE_VALUE,
  type PricingCalc, type PricingMethod, type PricingMode,
} from "@/lib/pricing";
import type { CommodityKind, QuoteLeg, ShipmentType } from "@/lib/types";

/** Quote context shared by Set pricing and Review & send. Filled from a selected
    rate (Rate Quote) or from a manually built route (Custom Route) — the steps
    themselves are agnostic to which flow produced it. */
export interface QuoteMeta {
  quoteId: string;
  origin: string;
  destination: string;
  commodityLabel: string;
  commodityKind: CommodityKind;
  shipmentType: ShipmentType;
  currency: string;
  validTo: string;
  transitDays: number;
  carrierId?: string;
}

// ── model ────────────────────────────────────────────────────────────────────

/** Everything the pricing + review steps read and mutate. Kept in one object so
    state survives navigation between Set pricing and Review & send. */
export interface PricingModel {
  legs: QuoteLeg[];
  setLegs: Dispatch<SetStateAction<QuoteLeg[]>>;
  mode: PricingMode;
  setMode: (m: PricingMode) => void;
  wholeMethod: PricingMethod;
  setWholeMethod: (m: PricingMethod) => void;
  wholeValue: number;
  setWholeValue: (v: number) => void;
  serviceMethod: Record<string, PricingMethod>;
  setServiceMethod: (id: string, m: PricingMethod) => void;
  serviceValue: Record<string, number>;
  setServiceValue: (id: string, v: number) => void;
  showCarrier: boolean;
  setShowCarrier: (v: boolean) => void;
  allInOnly: boolean;
  setAllInOnly: (v: boolean) => void;
  calc: PricingCalc;
  /** Refresh the priced legs from a fresh set (used when the underlying route
      changes in Custom Route) while PRESERVING the manager's profit settings —
      per-service profit is keyed by leg id, so it survives renames/reorders. */
  syncLegs: (legs: QuoteLeg[]) => void;
}

const cloneLegs = (legs: QuoteLeg[]) => JSON.parse(JSON.stringify(legs)) as QuoteLeg[];

export function usePricingModel(initialLegs: QuoteLeg[]): PricingModel {
  const [legs, setLegs] = useState<QuoteLeg[]>(() => cloneLegs(initialLegs));
  const [mode, setMode] = useState<PricingMode>("whole");
  const [wholeMethod, setWholeMethod] = useState<PricingMethod>("markup");
  const [wholeValue, setWholeValue] = useState(DEFAULT_SERVICE_VALUE);
  const [serviceMethod, setServiceMethodMap] = useState<Record<string, PricingMethod>>({});
  const [serviceValue, setServiceValueMap] = useState<Record<string, number>>({});
  const [showCarrier, setShowCarrier] = useState(true);
  const [allInOnly, setAllInOnly] = useState(false);

  const calc = useMemo(
    () => computePricing({ legs, mode, wholeMethod, wholeValue, serviceMethod, serviceValue }),
    [legs, mode, wholeMethod, wholeValue, serviceMethod, serviceValue],
  );

  const syncLegs = useCallback((nextLegs: QuoteLeg[]) => setLegs(cloneLegs(nextLegs)), []);

  return {
    legs,
    setLegs,
    mode,
    setMode,
    wholeMethod,
    setWholeMethod,
    wholeValue,
    setWholeValue,
    serviceMethod,
    setServiceMethod: (id, m) => setServiceMethodMap((prev) => ({ ...prev, [id]: m })),
    serviceValue,
    setServiceValue: (id, v) => setServiceValueMap((prev) => ({ ...prev, [id]: v })),
    showCarrier,
    setShowCarrier,
    allInOnly,
    setAllInOnly,
    calc,
    syncLegs,
  };
}

// ── formatting ───────────────────────────────────────────────────────────────

/** Round to at most one decimal and drop a trailing ".0". */
export function pct(n: number): string {
  const r = Math.round(n * 10) / 10;
  return (Number.isInteger(r) ? r.toFixed(0) : r.toFixed(1)) + "%";
}

const METHODS: PricingMethod[] = ["fixed", "markup", "margin"];

// ── profit method + value control (shared by whole-quote and per-service) ──
export function MethodControls({
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

export function Equivalents({ cost, profit }: { cost: number; profit: number }) {
  const eq = equivalents(cost, profit);
  return (
    <p className="text-caption text-muted-foreground">
      Profit <span className="font-medium text-foreground">{money(eq.profit)}</span> ·{" "}
      {pct(eq.markupPct)} markup · {pct(eq.marginPct)} margin
    </p>
  );
}

// ── mutually-exclusive pricing mode selector ──
export function PricingModeSelector({ model }: { model: PricingModel }) {
  return (
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
  );
}

// ── "Internal cost + Profit = Client price" summary (+ whole-mode controls) ──
export function PricingSummaryCard({ model }: { model: PricingModel }) {
  const { calc } = model;
  return (
    <Card className="space-y-3 p-4">
      <div className="text-sm font-semibold">Quote pricing</div>

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
          Profit is set on each service. This total is the sum of every included service.
        </p>
      )}
    </Card>
  );
}

// ── per-service profit block (Price by service mode) ──
export function ServiceProfitControls({ model, legId }: { model: PricingModel; legId: string }) {
  const cost = model.calc.legCost[legId] ?? 0;
  const method = model.serviceMethod[legId] ?? DEFAULT_SERVICE_METHOD;
  const value = model.serviceValue[legId] ?? DEFAULT_SERVICE_VALUE;
  const profit = model.calc.legProfit[legId] ?? 0;
  const clientAmt = model.calc.clientLegAmount[legId] ?? 0;
  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <MethodControls
        idBase={`svc-${legId}`}
        method={method}
        value={value}
        onMethod={(m) => model.setServiceMethod(legId, m)}
        onValue={(v) => model.setServiceValue(legId, v)}
      />
      <Equivalents cost={cost} profit={profit} />
      <div className="flex items-center justify-between border-t pt-2 text-sm">
        <span className="text-muted-foreground">Client price for this service</span>
        <span className="font-semibold tabular-nums">{money(clientAmt)}</span>
      </div>
    </div>
  );
}
