"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, Info, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RateResultCard } from "@/components/quote/rate-result-card";
import { RequirementsPanel } from "@/components/quote/requirements-panel";
import { CarrierLogo } from "@/components/carrier-logo";
import { SourceBadge } from "@/components/status-badge";
import { money } from "@/lib/format";
import { getCarrier } from "@/lib/data/carriers";
import type { RateOption, RouteRequirement } from "@/lib/types";

type ViaMode = "all" | "direct";
type SortKey = "recommended" | "price-asc" | "price-desc" | "transit-asc" | "transit-desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "transit-asc", label: "Transit time: fastest first" },
  { value: "transit-desc", label: "Transit time: longest first" },
];

const SORT_FNS: Record<SortKey, (a: RateOption, b: RateOption) => number> = {
  recommended: (a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0) || a.total - b.total,
  "price-asc": (a, b) => a.total - b.total,
  "price-desc": (a, b) => b.total - a.total,
  "transit-asc": (a, b) => a.transitDays - b.transitDays,
  "transit-desc": (a, b) => b.transitDays - a.transitDays,
};

export function ResultsView({
  rates, requirements, lane, advanced, onSelect, onEditShipment,
}: {
  rates: RateOption[];
  requirements: RouteRequirement[];
  lane: string;
  advanced: boolean;
  onSelect: (r: RateOption) => void;
  onEditShipment: () => void;
}) {
  const carriers = useMemo(() => Array.from(new Set(rates.map((r) => r.carrierId))), [rates]);
  const sources = useMemo(() => Array.from(new Set(rates.map((r) => r.sourceType))), [rates]);

  const prices = rates.map((r) => r.total);
  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 0;
  const maxTransit = rates.length ? Math.max(...rates.map((r) => r.transitDays)) : 0;

  const [selectedCarriers, setSelectedCarriers] = useState<Set<string>>(new Set(carriers));
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set(sources));
  const [viaMode, setViaMode] = useState<ViaMode>("all");
  const [maxTransitVal, setMaxTransitVal] = useState(maxTransit);
  const [priceRange, setPriceRange] = useState<[number, number]>([minP, maxP]);
  const [minText, setMinText] = useState(String(minP));
  const [maxText, setMaxText] = useState(String(maxP));
  const [priceError, setPriceError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("recommended"); // engine marks a reliable recommended rate
  const [showExpired, setShowExpired] = useState(false); // expired hidden by default

  const filtered = useMemo(() => {
    let out = rates.filter((r) => selectedCarriers.has(r.carrierId));
    out = out.filter((r) => selectedSources.has(r.sourceType));
    if (viaMode === "direct") out = out.filter((r) => !r.via || r.via === "Direct");
    out = out.filter((r) => r.transitDays <= maxTransitVal);
    out = out.filter((r) => r.total >= priceRange[0] && r.total <= priceRange[1]);
    if (!showExpired) out = out.filter((r) => !r.expired);
    return [...out].sort(SORT_FNS[sort]);
  }, [rates, selectedCarriers, selectedSources, viaMode, maxTransitVal, priceRange, showExpired, sort]);

  const toggleCarrier = (id: string) =>
    setSelectedCarriers((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSource = (s: string) =>
    setSelectedSources((prev) => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });

  // sync price slider -> inputs
  const onSlider = (v: number[]) => {
    setPriceRange([v[0], v[1]] as [number, number]);
    setMinText(String(v[0])); setMaxText(String(v[1]));
    setPriceError(null);
  };
  // commit inputs -> slider (on blur / Enter)
  const commitPrice = () => {
    const lo = Number(minText), hi = Number(maxText);
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo < 0 || hi < 0) {
      setPriceError("Enter valid, non-negative prices."); return;
    }
    if (lo > hi) { setPriceError("Min price cannot exceed max price."); return; }
    const clamped: [number, number] = [Math.max(minP, lo), Math.min(maxP, hi)];
    setPriceRange(clamped);
    setMinText(String(clamped[0])); setMaxText(String(clamped[1]));
    setPriceError(null);
  };

  // count active filter groups (each group that differs from default counts once)
  const activeCount =
    (selectedCarriers.size !== carriers.length ? 1 : 0) +
    (selectedSources.size !== sources.length ? 1 : 0) +
    (viaMode !== "all" ? 1 : 0) +
    (maxTransitVal !== maxTransit ? 1 : 0) +
    (priceRange[0] !== minP || priceRange[1] !== maxP ? 1 : 0) +
    (showExpired ? 1 : 0);

  const clearFilters = () => {
    setSelectedCarriers(new Set(carriers));
    setSelectedSources(new Set(sources));
    setViaMode("all");
    setMaxTransitVal(maxTransit);
    setPriceRange([minP, maxP]); setMinText(String(minP)); setMaxText(String(maxP));
    setPriceError(null);
    setShowExpired(false);
  };

  const hasTransshipment = rates.some((r) => r.via && r.via !== "Direct");
  const filtersPanel = (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="size-4" /> Filters
          {activeCount > 0 && <Badge variant="status-info" className="h-5 px-1.5">{activeCount}</Badge>}
        </div>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" className="-my-1 h-7 gap-1 px-2 text-muted-foreground" onClick={clearFilters}>
            <RotateCcw className="size-3.5" /> Clear filters
          </Button>
        )}
      </div>

      {/* Price range */}
      <div className="space-y-2.5 text-sm">
        <span className="text-xs font-medium text-muted-foreground">Price range</span>
        <Slider
          min={minP}
          max={maxP}
          step={Math.max(1, Math.round((maxP - minP) / 100) || 1)}
          value={priceRange}
          onValueChange={onSlider}
        />
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="rv-min" className="text-xs">Min price</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-muted-foreground">$</span>
              <Input id="rv-min" size="sm" type="number" min={0} inputMode="numeric" value={minText}
                aria-invalid={!!priceError} className="pl-5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                onChange={(e) => setMinText(e.target.value)} onBlur={commitPrice}
                onKeyDown={(e) => e.key === "Enter" && commitPrice()} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="rv-max" className="text-xs">Max price</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-muted-foreground">$</span>
              <Input id="rv-max" size="sm" type="number" min={0} inputMode="numeric" value={maxText}
                aria-invalid={!!priceError} className="pl-5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                onChange={(e) => setMaxText(e.target.value)} onBlur={commitPrice}
                onKeyDown={(e) => e.key === "Enter" && commitPrice()} />
            </div>
          </div>
        </div>
        {priceError && <p role="alert" className="text-xs font-medium text-destructive">{priceError}</p>}
      </div>

      <Separator className="my-3" />

      {/* Max transit */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">Max transit</span>
          <span className="tabular-nums text-foreground">≤ {maxTransitVal} days</span>
        </div>
        <Slider min={0} max={maxTransit} step={1} value={[maxTransitVal]} onValueChange={(v) => setMaxTransitVal(v[0])} />
      </div>

      <Separator className="my-3" />

      <div className="mb-2 text-xs font-medium text-muted-foreground">Source ({sources.length})</div>
      <div className="space-y-2">
        {sources.map((s) => (
          <label key={s} className="flex items-center gap-2 text-sm">
            <Checkbox checked={selectedSources.has(s)} onCheckedChange={() => toggleSource(s)} />
            <SourceBadge source={s} />
          </label>
        ))}
      </div>

      {hasTransshipment && (
        <>
          <Separator className="my-3" />
          <div className="mb-2 text-xs font-medium text-muted-foreground">Routing</div>
          <div className="flex gap-1.5">
            {(["all", "direct"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setViaMode(m)}
                className={[
                  "flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                  viaMode === m ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
                ].join(" ")}>
                {m === "all" ? "All routes" : "Direct only"}
              </button>
            ))}
          </div>
        </>
      )}

      <Separator className="my-3" />

      <div className="mb-2 text-xs font-medium text-muted-foreground">Carriers ({carriers.length})</div>
      <div className="space-y-2">
        {carriers.map((cid) => (
          <label key={cid} className="flex items-center gap-2 text-sm">
            <Checkbox checked={selectedCarriers.has(cid)} onCheckedChange={() => toggleCarrier(cid)} />
            <CarrierLogo carrierId={cid} size="sm" />
            <span className="truncate">{getCarrier(cid)?.name}</span>
          </label>
        ))}
      </div>

      <Separator className="my-3" />
      <label className="flex items-center justify-between text-sm">
        <span>Show expired rates</span>
        <Switch checked={showExpired} onCheckedChange={setShowExpired} />
      </label>
    </Card>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[256px_1fr]">
      <aside className="space-y-4">{filtersPanel}</aside>

      <div className="space-y-3">
        <RequirementsPanel requirements={requirements} lane={lane} />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <p aria-live="polite" className="text-sm font-medium">
              {filtered.length} {filtered.length === 1 ? "rate" : "rates"} found
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="What rate sources are included?" className="rounded-full text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50">
                  <Info className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Includes contract and offline tariff rates{advanced ? ", plus connected spot and carrier-API sources" : ""}.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="rv-sort" className="text-xs text-muted-foreground">Sort by</Label>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger id="rv-sort" size="sm" className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.map((r) => <RateResultCard key={r.id} rate={r} onSelect={onSelect} />)}

        {!filtered.length && (
          <Card className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm font-medium">No rates match these filters.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {activeCount > 0 && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={clearFilters}>
                  <RotateCcw className="size-4" /> Clear filters
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onEditShipment}>Back to shipment details</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
