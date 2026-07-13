"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Search, Sparkles, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { LocationCombobox, type LocationValue } from "@/components/location-combobox";
import { CommodityPicker, type CommoditySelection, defaultCommodity } from "@/components/commodity-picker";
import type { SearchInput } from "@/lib/quote-engine";
import { encodeSearch } from "@/lib/search-params";
import { cn } from "@/lib/utils";

function buildInput(
  origin: LocationValue, dest: LocationValue, commodity: CommoditySelection,
  advanced: boolean, loadingDate: string,
): SearchInput {
  return {
    originPortId: origin.kind === "port" ? origin.id : undefined,
    originAddressId: origin.kind === "address" ? origin.id : undefined,
    destPortId: dest.kind === "port" ? dest.id : undefined,
    destAddressId: dest.kind === "address" ? dest.id : undefined,
    equipmentId: commodity.equipmentId,
    commodityKind: commodity.kind,
    commodityLabel: commodity.label,
    shipmentType: commodity.shipmentType,
    container: commodity.container,
    advancedSearch: advanced,
    loadingDate: loadingDate || undefined,
  };
}

export function QuoteSearchWidget({
  initial,
  onSearch,
  className,
}: {
  initial?: Partial<{ origin: LocationValue; dest: LocationValue; commodity: CommoditySelection; advanced: boolean; loadingDate: string }>;
  onSearch?: (input: SearchInput) => void;
  className?: string;
}) {
  const router = useRouter();
  const [origin, setOrigin] = useState<LocationValue | undefined>(initial?.origin);
  const [dest, setDest] = useState<LocationValue | undefined>(initial?.dest);
  const [commodity, setCommodity] = useState<CommoditySelection>(initial?.commodity ?? defaultCommodity());
  const [advanced, setAdvanced] = useState(initial?.advanced ?? false);
  const [loadingDate, setLoadingDate] = useState(initial?.loadingDate ?? "");
  const [error, setError] = useState<string | null>(null);

  const swap = () => { setOrigin(dest); setDest(origin); };

  const submit = () => {
    if (!origin || !dest) return setError("Select both origin and destination.");
    if (!commodity.label && !commodity.equipmentId) return setError("Select or describe the commodity.");
    setError(null);
    const input = buildInput(origin, dest, commodity, advanced, loadingDate);
    if (onSearch) onSearch(input);
    else router.push(`/quote-master?${encodeSearch(input)}`);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Origin ⇄ Destination */}
      <div className="grid items-end gap-2 sm:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-1.5">
          <Label>Origin</Label>
          <LocationCombobox value={origin} onChange={setOrigin} placeholder="Port or pickup address…" />
        </div>
        <Button variant="outline" size="icon" className="mb-0.5 hidden shrink-0 sm:inline-flex" onClick={swap} title="Swap">
          <ArrowLeftRight className="size-4" />
        </Button>
        <div className="space-y-1.5">
          <Label>Destination</Label>
          <LocationCombobox value={dest} onChange={setDest} placeholder="Port or delivery address…" />
        </div>
      </div>

      <CommodityPicker value={commodity} onChange={setCommodity} />

      {/* Options */}
      <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2.5">
          <Switch checked={advanced} onCheckedChange={setAdvanced} />
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Sparkles className="size-4 text-primary" /> Extended quote search
            <span className="font-normal text-muted-foreground">(Shipping Line APIs & spot sources)</span>
          </span>
        </label>
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" />
          <Label htmlFor="ld" className="text-sm text-muted-foreground">Loading date</Label>
          <Input id="ld" type="date" value={loadingDate} onChange={(e) => setLoadingDate(e.target.value)} className="h-9 w-auto" />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button size="lg" className="w-full gap-2" onClick={submit}>
        <Search className="size-4" /> Search rates
      </Button>
    </div>
  );
}
