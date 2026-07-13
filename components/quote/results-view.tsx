"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RateResultCard } from "@/components/quote/rate-result-card";
import { RequirementsPanel } from "@/components/quote/requirements-panel";
import { CarrierLogo } from "@/components/carrier-logo";
import { SourceBadge } from "@/components/status-badge";
import { money } from "@/lib/format";
import { getCarrier } from "@/lib/data/carriers";
import type { RateOption, RouteRequirement } from "@/lib/types";

type ViaMode = "all" | "direct";

export function ResultsView({
  rates, requirements, lane, advanced, onChoose,
}: {
  rates: RateOption[];
  requirements: RouteRequirement[];
  lane: string;
  advanced: boolean;
  onChoose: (r: RateOption) => void;
}) {
  const carriers = useMemo(
    () => Array.from(new Set(rates.map((r) => r.carrierId))),
    [rates],
  );
  const sources = useMemo(
    () => Array.from(new Set(rates.map((r) => r.sourceType))),
    [rates],
  );

  const prices = rates.map((r) => r.total);
  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 0;
  const maxTransit = rates.length ? Math.max(...rates.map((r) => r.transitDays)) : 0;

  const [selected, setSelected] = useState<Set<string>>(new Set(carriers));
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set(sources));
  const [viaMode, setViaMode] = useState<ViaMode>("all");
  const [maxTransitVal, setMaxTransitVal] = useState(maxTransit);
  const [priceRange, setPriceRange] = useState<[number, number]>([minP, maxP]);
  const [sort, setSort] = useState<"price" | "transit">("price");
  const [hideExpired, setHideExpired] = useState(false);

  const filtered = useMemo(() => {
    let out = rates.filter((r) => selected.has(r.carrierId));
    out = out.filter((r) => selectedSources.has(r.sourceType));
    if (viaMode === "direct") out = out.filter((r) => !r.via || r.via === "Direct");
    out = out.filter((r) => r.transitDays <= maxTransitVal);
    out = out.filter((r) => r.total >= priceRange[0] && r.total <= priceRange[1]);
    if (hideExpired) out = out.filter((r) => !r.expired);
    out = [...out].sort((a, b) => (sort === "price" ? a.total - b.total : a.transitDays - b.transitDays));
    return out;
  }, [rates, selected, selectedSources, viaMode, maxTransitVal, priceRange, hideExpired, sort]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSource = (s: string) => {
    setSelectedSources((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  };

  const isDefault =
    selected.size === carriers.length &&
    selectedSources.size === sources.length &&
    viaMode === "all" &&
    maxTransitVal === maxTransit &&
    priceRange[0] === minP &&
    priceRange[1] === maxP &&
    !hideExpired;

  const clearAll = () => {
    setSelected(new Set(carriers));
    setSelectedSources(new Set(sources));
    setViaMode("all");
    setMaxTransitVal(maxTransit);
    setPriceRange([minP, maxP]);
    setHideExpired(false);
  };

  const hasTransshipment = rates.some((r) => r.via && r.via !== "Direct");

  return (
    <div className="grid gap-5 lg:grid-cols-[256px_1fr]">
      {/* Filters */}
      <aside className="space-y-4">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <SlidersHorizontal className="size-4" /> Filters
            </div>
            {!isDefault && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-medium text-primary hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Price range */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Price range</span>
              <span className="tabular-nums text-foreground">
                {money(priceRange[0])} – {money(priceRange[1])}
              </span>
            </div>
            <Slider
              min={minP}
              max={maxP}
              step={Math.max(1, Math.round((maxP - minP) / 100) || 1)}
              value={priceRange}
              onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
            />
          </div>

          <Separator className="my-3" />

          {/* Max transit */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Max transit</span>
              <span className="tabular-nums text-foreground">≤ {maxTransitVal} days</span>
            </div>
            <Slider
              min={0}
              max={maxTransit}
              step={1}
              value={[maxTransitVal]}
              onValueChange={(v) => setMaxTransitVal(v[0])}
            />
          </div>

          <Separator className="my-3" />

          {/* Source */}
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
              {/* Via */}
              <div className="mb-2 text-xs font-medium text-muted-foreground">Routing</div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setViaMode("all")}
                  className={[
                    "flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                    viaMode === "all"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  All routes
                </button>
                <button
                  type="button"
                  onClick={() => setViaMode("direct")}
                  className={[
                    "flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                    viaMode === "direct"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  Direct only
                </button>
              </div>
            </>
          )}

          <Separator className="my-3" />

          {/* Carriers */}
          <div className="mb-2 text-xs font-medium text-muted-foreground">Carriers ({carriers.length})</div>
          <div className="space-y-2">
            {carriers.map((cid) => (
              <label key={cid} className="flex items-center gap-2 text-sm">
                <Checkbox checked={selected.has(cid)} onCheckedChange={() => toggle(cid)} />
                <CarrierLogo carrierId={cid} size="sm" />
                <span className="truncate">{getCarrier(cid)?.name}</span>
              </label>
            ))}
          </div>

          <Separator className="my-3" />
          <label className="flex items-center justify-between text-sm">
            <span>Hide expired rates</span>
            <Switch checked={hideExpired} onCheckedChange={setHideExpired} />
          </label>
        </Card>
      </aside>

      {/* Results */}
      <div className="space-y-3">
        <RequirementsPanel requirements={requirements} lane={lane} />

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filtered.length}</span> of {rates.length} options
            {advanced && <span className="ml-1">· incl. API & spot sources</span>}
          </p>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="size-4 text-muted-foreground" />
            <Select value={sort} onValueChange={(v) => setSort(v as "price" | "transit")}>
              <SelectTrigger className="h-8 w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="price">Price: low to high</SelectItem>
                <SelectItem value="transit">Transit: fast to slow</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.map((r) => (
          <RateResultCard key={r.id} rate={r} onChoose={onChoose} onDetails={onChoose} />
        ))}
        {!filtered.length && (
          <Card className="p-8 text-center text-sm text-muted-foreground">No rates match the current filters.</Card>
        )}
      </div>
    </div>
  );
}
