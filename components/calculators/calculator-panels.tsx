"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Search, Copy, LayoutTemplate, SearchX } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { LocationCombobox, type LocationValue } from "@/components/location-combobox";
import { RateResultCard } from "@/components/quote/rate-result-card";
import { CarrierLogo } from "@/components/carrier-logo";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  TRUCKING_TYPES,
  LOADING_RULES,
  CFS_FACILITIES,
  SURCHARGES,
  CARRIERS,
  CONTAINERS,
  CONTAINER_LABEL,
  EQUIPMENT,
  getCalculator,
} from "@/lib/data";
import { buildRateOptions, type SearchInput } from "@/lib/quote-engine";
import type { CalculatorId, ContainerCode, ShipmentType, RateOption } from "@/lib/types";

// ── Small shared bits ────────────────────────────────────────────────────────
function NumberField({
  label,
  value,
  onChange,
  step,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  suffix?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          step={step ?? "any"}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="tabular-nums pr-12"
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function ResultRow({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className={cn("text-muted-foreground", muted && "text-xs")}>{label}</span>
      <span className={cn("tabular-nums", strong ? "text-base font-semibold" : "font-medium", muted && "text-xs text-muted-foreground")}>
        {value}
      </span>
    </div>
  );
}

/** Consistent post-calculation actions shared by every calculator: save the
    completed calculation to My History, copy the result, or save the setup as a
    reusable template. (Add-to-quote / add-to-route transfer is not wired — the
    current architecture has no cross-workflow value hand-off; see summary.) */
function ResultActions({ calcName, summary }: { calcName: string; summary: string }) {
  const router = useRouter();
  const [tplOpen, setTplOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const titleErr = !title.trim() ? "Enter a template title" : null;

  const copy = () => {
    navigator.clipboard?.writeText(`${calcName}: ${summary}`);
    toast.success("Result copied");
  };
  const saveHistory = () =>
    toast.success("Calculation saved to My History", { description: `${calcName} · ${summary}` });

  return (
    <div className="space-y-2 pt-1">
      <Button variant="outline" className="w-full gap-2" onClick={saveHistory}>
        <Save className="size-4" /> Save to My History
      </Button>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" className="flex-1 gap-1.5" onClick={copy}>
          <Copy className="size-4" /> Copy result
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => { setTitle(`${calcName} setup`); setDesc(""); setTplOpen(true); }}
        >
          <LayoutTemplate className="size-4" /> Save as template
        </Button>
      </div>

      <Dialog open={tplOpen} onOpenChange={setTplOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save as template</DialogTitle>
            <DialogDescription>Save this {calcName} setup to reuse the inputs from Templates.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="calc-tpl-name"><span>Template title<span aria-hidden className="ml-0.5 text-sidebar-primary">*</span></span></Label>
              <Input id="calc-tpl-name" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!titleErr} aria-describedby={titleErr ? "calc-tpl-err" : undefined} />
              {titleErr && <p id="calc-tpl-err" role="alert" className="text-xs font-medium text-destructive">{titleErr}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calc-tpl-desc">Description <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Textarea id="calc-tpl-desc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="When to use this template…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTplOpen(false)}>Cancel</Button>
            <Button
              disabled={!!titleErr}
              onClick={() => {
                setTplOpen(false);
                toast.success("Template saved", {
                  description: `“${title.trim()}” is ready to reuse from Templates.`,
                  action: { label: "View template", onClick: () => router.push("/templates") },
                });
              }}
            >
              <LayoutTemplate className="size-4" /> Save template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TwoCol({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-base">Inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">{left}</CardContent>
      </Card>
      <Card className="min-w-0 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">Result</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">{right}</CardContent>
      </Card>
    </div>
  );
}

// ── 1. Trucking ──────────────────────────────────────────────────────────────
function widthBandMatch(t: (typeof TRUCKING_TYPES)[number], widthIn: number): boolean {
  const d = t.dimensions;
  if (widthIn <= 102) return d.includes("0–102") || d.includes("102\"");
  if (widthIn <= 144) return d.includes("102–144");
  if (widthIn <= 156) return d.includes("144–156");
  return d.includes("156") || d.includes("144–156");
}

function bandUpper(weightBand: string): number {
  const nums = weightBand.replace(/,/g, "").match(/\d+/g);
  return nums ? Math.max(...nums.map(Number)) : Infinity;
}

function TruckingPanel() {
  const [widthIn, setWidthIn] = useState(120);
  const [weightLb, setWeightLb] = useState(42000);
  const [miles, setMiles] = useState(450);
  const [override, setOverride] = useState<string>("auto");

  const matched = useMemo(() => {
    if (override !== "auto") return TRUCKING_TYPES.find((t) => String(t.type) === override);
    const candidates = TRUCKING_TYPES.filter((t) => widthBandMatch(t, widthIn)).filter(
      (t) => weightLb <= bandUpper(t.weightBand)
    );
    const pool = candidates.length ? candidates : TRUCKING_TYPES.filter((t) => weightLb <= bandUpper(t.weightBand));
    // cheapest viable match
    return [...pool].sort((a, b) => a.ratePerMile - b.ratePerMile)[0] ?? TRUCKING_TYPES[0];
  }, [widthIn, weightLb, override]);

  const total = matched ? matched.ratePerMile * miles : 0;

  return (
    <TwoCol
      left={
        <>
          <NumberField label="Cargo width" value={widthIn} onChange={setWidthIn} suffix="in" />
          <NumberField label="Cargo weight" value={weightLb} onChange={setWeightLb} suffix="lb" />
          <NumberField label="Distance" value={miles} onChange={setMiles} suffix="mi" />
          <div className="space-y-1.5">
            <Label className="text-xs">Trucking type</Label>
            <Select value={override} onValueChange={setOverride}>
              <SelectTrigger aria-label="Trucking type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-match by width &amp; weight</SelectItem>
                {TRUCKING_TYPES.map((t) => (
                  <SelectItem key={t.type} value={String(t.type)}>
                    #{t.type} · {t.trailer} · {money(t.ratePerMile)}/mi
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      }
      right={
        matched ? (
          <>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Type #{matched.type}</Badge>
              <span className="text-xs text-muted-foreground">{override === "auto" ? "auto-matched" : "manual"}</span>
            </div>
            <ResultRow label="Trailer" value={matched.trailer} />
            <ResultRow label="Axles" value={matched.axles} />
            <ResultRow label="Dimensions band" value={matched.dimensions} muted />
            <ResultRow label="Weight band" value={matched.weightBand} muted />
            <Separator />
            <ResultRow label="Rate / mile" value={money(matched.ratePerMile)} />
            <ResultRow label="Distance" value={`${miles} mi`} />
            <Separator />
            <ResultRow label="Total trucking" value={money(total)} strong />
            <ResultActions calcName="US / Canada Trucking" summary={`${money(total)} · Type #${matched.type}`} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No matching trucking type.</p>
        )
      }
    />
  );
}

// ── 2. RoRo ──────────────────────────────────────────────────────────────────
function RoRoPanel() {
  const [ratePerWm, setRatePerWm] = useState(33);
  const [baf, setBaf] = useState(4.58);
  const [eca, setEca] = useState(0.75);
  const [euEts, setEuEts] = useState(0.31);
  const [thc, setThc] = useState(250);
  const [wfg, setWfg] = useState(1.2);
  const [docFee, setDocFee] = useState(50);
  const [lengthM, setLengthM] = useState(5);
  const [widthM, setWidthM] = useState(2);
  const [heightM, setHeightM] = useState(4);
  const [margin, setMargin] = useState(1000);

  const cbm = lengthM * widthM * heightM;
  const perWm = ratePerWm + baf + eca + euEts;
  const freight = perWm * cbm;
  const wharfage = wfg * cbm;
  const total = freight + thc + wharfage + docFee + margin;

  return (
    <TwoCol
      left={
        <>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Base rate / W/M" value={ratePerWm} onChange={setRatePerWm} suffix="$" />
            <NumberField label="BAF" value={baf} onChange={setBaf} suffix="$" />
            <NumberField label="ECA" value={eca} onChange={setEca} suffix="$" />
            <NumberField label="EU-ETS" value={euEts} onChange={setEuEts} suffix="$" />
          </div>
          <Separator />
          <div className="grid grid-cols-3 gap-3">
            <NumberField label="Length" value={lengthM} onChange={setLengthM} suffix="m" />
            <NumberField label="Width" value={widthM} onChange={setWidthM} suffix="m" />
            <NumberField label="Height" value={heightM} onChange={setHeightM} suffix="m" />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="THC (flat)" value={thc} onChange={setThc} suffix="$" />
            <NumberField label="Wharfage / WM" value={wfg} onChange={setWfg} suffix="$" />
            <NumberField label="Doc fee (flat)" value={docFee} onChange={setDocFee} suffix="$" />
            <NumberField label="Margin" value={margin} onChange={setMargin} suffix="$" />
          </div>
        </>
      }
      right={
        <>
          <p className="rounded-md bg-muted/60 p-2 text-caption leading-relaxed text-muted-foreground">
            total = ((rate + BAF + ECA + EU-ETS) × CBM) + THC + (Wharfage × CBM) + Doc + Margin · Baltimore→Bremerhaven preset

          </p>
          <ResultRow label="CBM (L×W×H)" value={`${cbm.toLocaleString()} m³`} />
          <ResultRow label="Per-W/M stacked rate" value={money(perWm)} muted />
          <Separator />
          <ResultRow label={`Freight (${money(perWm)} × ${cbm} CBM)`} value={money(freight)} />
          <ResultRow label="THC" value={money(thc)} />
          <ResultRow label={`Wharfage (${money(wfg)} × ${cbm})`} value={money(wharfage)} />
          <ResultRow label="Doc fee" value={money(docFee)} />
          <ResultRow label="Margin" value={money(margin)} />
          <Separator />
          <ResultRow label="All-in total" value={money(total)} strong />
          <ResultActions calcName="RoRo Calculator" summary={`${money(total)} · ${cbm} CBM`} />
        </>
      }
    />
  );
}

// ── 3. Loading ───────────────────────────────────────────────────────────────
function LoadingPanel() {
  const [loadType, setLoadType] = useState(LOADING_RULES[0].loadType);
  const [qty, setQty] = useState(3);
  const rule = LOADING_RULES.find((r) => r.loadType === loadType) ?? LOADING_RULES[0];

  // per-unit rules carry "$130 / row" style notes — extract a number if present
  const perUnit = rule.perUnitNote ? parseFloat(rule.perUnitNote.replace(/[^0-9.]/g, "")) || 0 : 0;
  const usesQty = !!rule.perUnitNote && perUnit > 0;
  const loadComponent = usesQty ? perUnit * qty : rule.loadCost;
  const total = loadComponent + rule.drayage + rule.margin;

  return (
    <TwoCol
      left={
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Loading / commodity type</Label>
            <Select value={loadType} onValueChange={setLoadType}>
              <SelectTrigger aria-label="Loading / commodity type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOADING_RULES.map((r) => (
                  <SelectItem key={r.loadType} value={r.loadType}>
                    {r.loadType} · {r.container}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {usesQty && (
            <NumberField label={`Quantity (${rule.perUnitNote})`} value={qty} onChange={setQty} step={1} />
          )}
          <div className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
            Container <span className="font-medium text-foreground">{rule.container}</span>
            {rule.unitsPerContainer && <> · {rule.unitsPerContainer} units / container</>}
            {rule.perUnitNote && <> · {rule.perUnitNote}</>}
          </div>
        </>
      }
      right={
        <>
          <div className="flex items-center justify-between">
            <Badge variant="secondary">{rule.loadType}</Badge>
            <Badge variant="outline">{rule.container}</Badge>
          </div>
          <Separator />
          <ResultRow
            label={usesQty ? `Loading (${money(perUnit)} × ${qty})` : "Loading cost"}
            value={money(loadComponent)}
          />
          <ResultRow label="Drayage" value={money(rule.drayage)} />
          <ResultRow label="Margin" value={money(rule.margin)} />
          {rule.unitsPerContainer && (
            <ResultRow label="Units per container" value={String(rule.unitsPerContainer)} muted />
          )}
          <Separator />
          <ResultRow label="Total" value={money(total)} strong />
          <ResultActions calcName="Loading Calculator" summary={`${money(total)} · ${rule.loadType}`} />
        </>
      }
    />
  );
}

// ── 4. Drayage ───────────────────────────────────────────────────────────────
const ACCESSORIALS = [
  { key: "prepull", label: "Pre-Pull", cost: 150 },
  { key: "weekend", label: "Weekend Delivery", cost: 250 },
  { key: "reefer", label: "Reefer", cost: 300 },
  { key: "triaxle", label: "Triaxle", cost: 120 },
] as const;

function DrayagePanel() {
  const [cfsId, setCfsId] = useState(CFS_FACILITIES[0].id);
  const [count, setCount] = useState(1);
  const [acc, setAcc] = useState<Record<string, boolean>>({});
  const cfs = CFS_FACILITIES.find((c) => c.id === cfsId) ?? CFS_FACILITIES[0];

  const accTotal = ACCESSORIALS.reduce((s, a) => s + (acc[a.key] ? a.cost : 0), 0);
  const perContainer = cfs.drayageUsd + accTotal;
  const total = perContainer * count;

  return (
    <TwoCol
      left={
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">CFS facility</Label>
            <Select value={cfsId} onValueChange={setCfsId}>
              <SelectTrigger aria-label="CFS facility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CFS_FACILITIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} · {c.nearestRampPort} · {money(c.drayageUsd)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Accessorials</Label>
            <div className="grid grid-cols-2 gap-2">
              {ACCESSORIALS.map((a) => (
                <label
                  key={a.key}
                  className="flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm hover:bg-muted/50"
                >
                  <Checkbox
                    checked={!!acc[a.key]}
                    onCheckedChange={(v) => setAcc((p) => ({ ...p, [a.key]: !!v }))}
                  />
                  <span className="flex-1">{a.label}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">+{money(a.cost)}</span>
                </label>
              ))}
            </div>
          </div>
          <NumberField label="Container count" value={count} onChange={setCount} step={1} />
        </>
      }
      right={
        <>
          <div className="flex items-center justify-between">
            <Badge variant="secondary">{cfs.name}</Badge>
            <Badge variant="outline">{cfs.nearestRampPort}</Badge>
          </div>
          <Separator />
          <ResultRow label="Base drayage" value={money(cfs.drayageUsd)} />
          {ACCESSORIALS.filter((a) => acc[a.key]).map((a) => (
            <ResultRow key={a.key} label={a.label} value={`+${money(a.cost)}`} />
          ))}
          <ResultRow label="Per container" value={money(perContainer)} />
          <ResultRow label="× containers" value={String(count)} muted />
          <Separator />
          <ResultRow label="Total drayage" value={money(total)} strong />
          <ResultActions calcName="Drayage Calculator" summary={`${money(total)} · ${cfs.name}`} />
        </>
      }
    />
  );
}

// ── 5. Ocean freight ─────────────────────────────────────────────────────────
function OceanFreightPanel() {
  const oceanSurcharges = useMemo(
    () => SURCHARGES.filter((s) => s.applicable && s.leg === "ocean" && s.code !== "BAS"),
    []
  );
  const [carrierId, setCarrierId] = useState(CARRIERS[0].id);
  const [base, setBase] = useState(3200);
  const [count, setCount] = useState(1);
  // default amounts for a few common surcharges
  const [amounts, setAmounts] = useState<Record<string, number>>({ BAF: 190, THC: 250, ECA: 15, ODF: 55 });
  const [on, setOn] = useState<Record<string, boolean>>({ BAF: true, THC: true, ECA: true, ODF: true });

  const surchargeTotal = oceanSurcharges.reduce((s, c) => s + (on[c.code] ? amounts[c.code] || 0 : 0), 0);
  const perContainer = base + surchargeTotal;
  const total = perContainer * count;

  return (
    <TwoCol
      left={
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Carrier (context)</Label>
            <Select value={carrierId} onValueChange={setCarrierId}>
              <SelectTrigger aria-label="Carrier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARRIERS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <NumberField label="Base ocean rate (BAS)" value={base} onChange={setBase} suffix="$" />
          <NumberField label="Container count" value={count} onChange={setCount} step={1} />
          <div className="space-y-1.5">
            <Label className="text-xs">Surcharges</Label>
            <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
              {oceanSurcharges.map((c) => (
                <div key={c.code} className="flex items-center gap-2 rounded-md border p-2">
                  <Checkbox
                    checked={!!on[c.code]}
                    onCheckedChange={(v) => setOn((p) => ({ ...p, [c.code]: !!v }))}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium">
                      <span className="font-mono">{c.code}</span> · {c.name}
                    </div>
                  </div>
                  <Input
                    type="number"
                    value={amounts[c.code] ?? 0}
                    onChange={(e) => setAmounts((p) => ({ ...p, [c.code]: parseFloat(e.target.value) || 0 }))}
                    disabled={!on[c.code]}
                    size="sm" className="w-24 tabular-nums"
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      }
      right={
        <>
          <CarrierLogo carrierId={carrierId} showName />
          <Separator />
          <ResultRow label="Base freight (BAS)" value={money(base)} />
          {oceanSurcharges
            .filter((c) => on[c.code] && (amounts[c.code] || 0) > 0)
            .map((c) => (
              <ResultRow key={c.code} label={`${c.code} · ${c.name}`} value={money(amounts[c.code] || 0)} muted />
            ))}
          <Separator />
          <ResultRow label="Per container" value={money(perContainer)} />
          <ResultRow label="× containers" value={String(count)} muted />
          <Separator />
          <ResultRow label="Ocean total" value={money(total)} strong />
          <ResultActions calcName="Ocean Freight Calculator" summary={money(total)} />
        </>
      }
    />
  );
}

// ── 6. Shipping lines (lane search) ──────────────────────────────────────────
function shipmentForContainer(code?: ContainerCode): ShipmentType {
  if (code === "40FR" || code === "20FR") return "Flatrack";
  if (code === "RORO") return "RoRo";
  return "Container";
}

function ShippingLinesPanel() {
  const [origin, setOrigin] = useState<LocationValue>();
  const [dest, setDest] = useState<LocationValue>();
  const [container, setContainer] = useState<ContainerCode>("40HC");
  const [results, setResults] = useState<RateOption[] | null>(null);

  function search() {
    if (!origin || !dest) {
      toast.error("Pick both an origin and a destination.");
      return;
    }
    if (origin.id === dest.id) {
      toast.error("Origin and destination must be different locations.");
      return;
    }
    const input: SearchInput = {
      originPortId: origin.kind === "port" ? origin.id : undefined,
      originAddressId: origin.kind === "address" ? origin.id : undefined,
      destPortId: dest.kind === "port" ? dest.id : undefined,
      destAddressId: dest.kind === "address" ? dest.id : undefined,
      commodityKind: "equipment",
      commodityLabel: "General cargo",
      shipmentType: shipmentForContainer(container),
      container,
      advancedSearch: true,
    };
    const opts = buildRateOptions(input);
    setResults(opts);
    toast.success(`Found ${opts.length} rate options for the lane.`);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lane search</CardTitle>
          <CardDescription>Compare live carrier offers for a port-to-port lane.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid items-end gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="sl-origin" className="text-xs">Origin</Label>
              <LocationCombobox id="sl-origin" value={origin} onChange={setOrigin} disabledId={dest?.id} disabledReason="Selected as destination" menuAlign="start" placeholder="Origin port / address…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sl-dest" className="text-xs">Destination</Label>
              <LocationCombobox id="sl-dest" value={dest} onChange={setDest} disabledId={origin?.id} disabledReason="Selected as origin" menuAlign="end" placeholder="Destination port / address…" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Container</Label>
              <Select value={container} onValueChange={(v) => setContainer(v as ContainerCode)}>
                <SelectTrigger className="min-w-44" aria-label="Container">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTAINERS.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="gap-2" onClick={search}>
              <Search className="size-4" /> Find rates
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{results.length} rate options</h2>
            <span className="text-xs text-muted-foreground">{shipmentForContainer(container)} · sorted by total</span>
          </div>
          {/* Was a bare <p> hugging the page gutter while every sibling in
              this stack is a padded card. */}
          {results.length === 0 && (
            <EmptyState icon={SearchX} title="No rates for this lane." />
          )}
          {results.slice(0, 6).map((r) => (
            <RateResultCard
              key={r.id}
              rate={r}
              onSelect={(rate) => toast.success(`Chose ${rate.carrierId} · ${money(rate.total)}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── 7. OOG / lost slots ──────────────────────────────────────────────────────
const FR_WIDTH_CM = 244; // 40' flat rack ~2.44 m wide = one TEU width slot

function OogPanel() {
  const [cargoWidthCm, setCargoWidthCm] = useState(300);
  const [overLeftCm, setOverLeftCm] = useState(40);
  const [overRightCm, setOverRightCm] = useState(40);

  const occupied = cargoWidthCm + overLeftCm + overRightCm;
  const isOverDim = occupied > FR_WIDTH_CM;
  const lostSlots = isOverDim ? Math.max(1, Math.ceil(occupied / FR_WIDTH_CM)) : 1;
  // the flat rack itself is 1 slot; additional blocked slots beyond it:
  const blocked = Math.max(0, lostSlots - 1);

  return (
    <TwoCol
      left={
        <>
          <NumberField label="Cargo width" value={cargoWidthCm} onChange={setCargoWidthCm} suffix="cm" />
          <NumberField label="Over-width left of rack" value={overLeftCm} onChange={setOverLeftCm} suffix="cm" />
          <NumberField label="Over-width right of rack" value={overRightCm} onChange={setOverRightCm} suffix="cm" />
          <div className="rounded-md bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
            A 40&apos; flat rack occupies one {FR_WIDTH_CM} cm (≈2.44 m) TEU-width slot. Cargo wider than the rack
            blocks the adjacent slot(s), which the carrier bills as lost capacity.
          </div>
        </>
      }
      right={
        <>
          <ResultRow label="Total occupied width" value={`${occupied.toLocaleString()} cm`} />
          <ResultRow label="Flat-rack slot width" value={`${FR_WIDTH_CM} cm`} muted />
          <ResultRow label="Over-dimension?" value={isOverDim ? "Yes" : "No"} />
          <Separator />
          <ResultRow label="Slots occupied" value={String(lostSlots)} />
          <ResultRow label="Lost (blocked) TEU slots" value={String(blocked)} strong />
          <p className="rounded-md bg-muted/60 p-2 text-caption leading-relaxed text-muted-foreground">
            lostSlots = ceil(({cargoWidthCm} + {overLeftCm} + {overRightCm}) / {FR_WIDTH_CM}) ={" "}
            {Math.ceil(occupied / FR_WIDTH_CM)}; the rack itself is one slot, so {blocked} extra slot(s) are billed.
          </p>
          <ResultActions calcName="OOG / Lost-Slot Calculator" summary={`${blocked} lost TEU slots`} />
        </>
      }
    />
  );
}

// ── 8. CBM & container fit ───────────────────────────────────────────────────
function CbmPanel() {
  const [lengthCm, setLengthCm] = useState(120);
  const [widthCm, setWidthCm] = useState(100);
  const [heightCm, setHeightCm] = useState(110);
  const [qty, setQty] = useState(10);
  const [code, setCode] = useState<ContainerCode>("40HC");

  const spec = CONTAINERS.find((c) => c.code === code) ?? CONTAINERS[0];
  const cbmEach = (lengthCm * widthCm * heightCm) / 1_000_000;
  const totalCbm = cbmEach * qty;
  const unitsFit = cbmEach > 0 ? Math.floor(spec.capacityCbm / cbmEach) : 0;
  const containersNeeded = unitsFit > 0 ? Math.ceil(qty / unitsFit) : 0;

  return (
    <TwoCol
      left={
        <>
          <div className="grid grid-cols-3 gap-3">
            <NumberField label="Length" value={lengthCm} onChange={setLengthCm} suffix="cm" />
            <NumberField label="Width" value={widthCm} onChange={setWidthCm} suffix="cm" />
            <NumberField label="Height" value={heightCm} onChange={setHeightCm} suffix="cm" />
          </div>
          <NumberField label="Quantity" value={qty} onChange={setQty} step={1} />
          <div className="space-y-1.5">
            <Label className="text-xs">Container</Label>
            <Select value={code} onValueChange={(v) => setCode(v as ContainerCode)}>
              <SelectTrigger aria-label="Container">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTAINERS.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label} · {c.capacityCbm} m³
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      }
      right={
        <>
          <ResultRow label="CBM per unit" value={`${cbmEach.toFixed(3)} m³`} />
          <ResultRow label="Total CBM" value={`${totalCbm.toFixed(2)} m³`} strong />
          <Separator />
          <ResultRow label={`${spec.label} capacity`} value={`${spec.capacityCbm} m³`} />
          <ResultRow label="Units fit per container" value={String(unitsFit)} />
          <ResultRow label="Containers needed" value={String(containersNeeded)} />
          <ResultActions calcName="CBM & Container Fit" summary={`${totalCbm.toFixed(2)} m³ · ${containersNeeded}× ${spec.code}`} />
        </>
      }
    />
  );
}

// ── 9. Equipment dimensions lookup ───────────────────────────────────────────
function EquipmentDimsPanel() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // default to a few combines / forklifts
      return EQUIPMENT.filter(
        (m) => m.productType === "Combines" || m.productType === "Forklifts"
      ).slice(0, 8);
    }
    return EQUIPMENT.filter((m) =>
      [m.make, m.model, m.category, m.type, m.productType].some((f) => f.toLowerCase().includes(q))
    ).slice(0, 30);
  }, [query]);

  const selected = useMemo(
    () => EQUIPMENT.find((m) => m.id === selectedId) ?? matches[0] ?? null,
    [selectedId, matches]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equipment catalog</CardTitle>
          <CardDescription>Search the master catalog by make, model or category.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. John Deere, S770, forklift…"
              className="pl-9"
            />
          </div>
          <div className="max-h-96 space-y-1.5 overflow-y-auto pr-1">
            {matches.length === 0 && (
              <p className="text-sm text-muted-foreground">No equipment matches “{query}”.</p>
            )}
            {matches.map((m) => {
              const active = selected?.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedId(m.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-md border p-2.5 text-left text-sm hover:bg-muted/50",
                    active && "border-primary/40 bg-primary/5"
                  )}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {m.make} {m.model}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {m.category} · {m.type}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {m.dimensions.lengthIn}×{m.dimensions.widthIn}×{m.dimensions.heightIn}″
                    <div>{CONTAINER_LABEL[m.container]}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">Specification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selected ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold">
                    {selected.make} {selected.model}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {selected.industry} · {selected.productType}
                  </div>
                </div>
                <Badge variant="secondary">{CONTAINER_LABEL[selected.container]}</Badge>
              </div>
              <Separator />
              <ResultRow label="Length" value={`${selected.dimensions.lengthIn.toLocaleString()} in`} />
              <ResultRow label="Width" value={`${selected.dimensions.widthIn.toLocaleString()} in`} />
              <ResultRow label="Height" value={`${selected.dimensions.heightIn.toLocaleString()} in`} />
              <ResultRow label="Weight" value={`${selected.dimensions.weightLb.toLocaleString()} lb`} />
              {selected.dimensions.cbm != null && (
                <ResultRow label="CBM" value={`${selected.dimensions.cbm.toLocaleString()} m³`} />
              )}
              <Separator />
              <ResultRow label="Recommended container" value={CONTAINER_LABEL[selected.container]} />
              <ResultRow label="Trucking type" value={`#${selected.truckingType}`} muted />
              <ResultRow label="Ocean type" value={`#${selected.oceanType}`} muted />
              {selected.unitsPerContainer != null && (
                <ResultRow label="Units per container" value={String(selected.unitsPerContainer)} muted />
              )}
              {selected.loadingNotes && (
                <p className="rounded-md bg-muted/60 p-2 text-caption leading-relaxed text-muted-foreground">
                  {selected.loadingNotes}
                </p>
              )}
              <ResultActions calcName="Equipment Dimension Lookup" summary={`${selected.make} ${selected.model} · ${CONTAINER_LABEL[selected.container]}`} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a model to view its full spec.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── 10. Air freight (chargeable weight) ──────────────────────────────────────
function AirFreightPanel() {
  const [actualWeightKg, setActualWeightKg] = useState(420);
  const [lengthCm, setLengthCm] = useState(120);
  const [widthCm, setWidthCm] = useState(100);
  const [heightCm, setHeightCm] = useState(90);
  const [pieces, setPieces] = useState(2);
  const [ratePerKg, setRatePerKg] = useState(4.5);

  const volumetricKg = (lengthCm * widthCm * heightCm * pieces) / 6000;
  const chargeableKg = Math.max(actualWeightKg, volumetricKg);
  const total = chargeableKg * ratePerKg;
  const useVolumetric = volumetricKg > actualWeightKg;

  return (
    <TwoCol
      left={
        <>
          <NumberField label="Actual weight" value={actualWeightKg} onChange={setActualWeightKg} suffix="kg" />
          <div className="grid grid-cols-3 gap-3">
            <NumberField label="Length" value={lengthCm} onChange={setLengthCm} suffix="cm" />
            <NumberField label="Width" value={widthCm} onChange={setWidthCm} suffix="cm" />
            <NumberField label="Height" value={heightCm} onChange={setHeightCm} suffix="cm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Pieces" value={pieces} onChange={setPieces} step={1} />
            <NumberField label="Rate / kg" value={ratePerKg} onChange={setRatePerKg} suffix="$" />
          </div>
        </>
      }
      right={
        <>
          <p className="rounded-md bg-muted/60 p-2 text-caption leading-relaxed text-muted-foreground">
            volumetric = (L × W × H × pieces) / 6000 · chargeable = max(actual, volumetric)
          </p>
          <ResultRow label="Actual weight" value={`${actualWeightKg.toLocaleString()} kg`} />
          <ResultRow label="Volumetric weight" value={`${volumetricKg.toFixed(1)} kg`} />
          <ResultRow
            label="Chargeable weight"
            value={`${chargeableKg.toFixed(1)} kg`}
          />
          <div className="text-right text-caption text-muted-foreground">
            ({useVolumetric ? "volumetric governs" : "actual governs"})
          </div>
          <Separator />
          <ResultRow label={`${chargeableKg.toFixed(1)} kg × ${money(ratePerKg)}`} value={money(total)} />
          <ResultRow label="Air freight total" value={money(total)} strong />
          <ResultActions calcName="Air Freight (Chargeable Weight)" summary={`${money(total)} · ${chargeableKg.toFixed(0)} kg chargeable`} />
        </>
      }
    />
  );
}

// ── 11. Demurrage ────────────────────────────────────────────────────────────
const DEMURRAGE_PORTS = [
  "Baltimore, US",
  "Houston, US",
  "Savannah, US",
  "Bremerhaven, DE",
  "Alexandria, EG",
  "Jebel Ali, AE",
] as const;

function DemurragePanel() {
  const [freeDays, setFreeDays] = useState(4);
  const [daysAtTerminal, setDaysAtTerminal] = useState(9);
  const [perDiemUsd, setPerDiemUsd] = useState(165);
  const [containers, setContainers] = useState(2);
  const [port, setPort] = useState<string>(DEMURRAGE_PORTS[0]);

  const daysOver = Math.max(0, daysAtTerminal - freeDays);
  const cost = daysOver * perDiemUsd * containers;

  return (
    <TwoCol
      left={
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Port (POL / POD)</Label>
            <Select value={port} onValueChange={setPort}>
              <SelectTrigger aria-label="Port (POL / POD)">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEMURRAGE_PORTS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Free days" value={freeDays} onChange={setFreeDays} step={1} />
            <NumberField label="Days at terminal" value={daysAtTerminal} onChange={setDaysAtTerminal} step={1} />
            <NumberField label="Per-diem rate" value={perDiemUsd} onChange={setPerDiemUsd} suffix="$" />
            <NumberField label="Containers" value={containers} onChange={setContainers} step={1} />
          </div>
        </>
      }
      right={
        <>
          <div className="flex items-center justify-between">
            <Badge variant="secondary">{port}</Badge>
          </div>
          <Separator />
          <ResultRow label="Free days" value={String(freeDays)} muted />
          <ResultRow label="Days at terminal" value={String(daysAtTerminal)} muted />
          <ResultRow label="Days over free time" value={String(daysOver)} />
          <ResultRow label={`${daysOver} × ${money(perDiemUsd)} × ${containers}`} value={money(cost)} />
          <Separator />
          <ResultRow label="Demurrage cost" value={money(cost)} strong />
          <p className="rounded-md bg-muted/60 p-2 text-caption leading-relaxed text-muted-foreground">
            Demurrage applies to containers held inside the terminal beyond the free time. Detention (per-diem outside
            the terminal) is billed separately.
          </p>
          <ResultActions calcName="Demurrage & Detention" summary={`${money(cost)} · ${daysOver} days over`} />
        </>
      }
    />
  );
}

// ── 12. Cargo insurance ──────────────────────────────────────────────────────
function InsurancePanel() {
  const [cargoValue, setCargoValue] = useState(85000);
  const [freightCost, setFreightCost] = useState(6500);
  const [ratePct, setRatePct] = useState(0.35);
  const [minPremium, setMinPremium] = useState(75);

  const insuredValue = (cargoValue + freightCost) * 1.1; // CIF + 10%
  const premium = Math.max(minPremium, (insuredValue * ratePct) / 100);
  const minApplied = premium <= minPremium;

  return (
    <TwoCol
      left={
        <>
          <NumberField label="Cargo value" value={cargoValue} onChange={setCargoValue} suffix="$" />
          <NumberField label="Freight cost" value={freightCost} onChange={setFreightCost} suffix="$" />
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Rate" value={ratePct} onChange={setRatePct} suffix="%" />
            <NumberField label="Min premium" value={minPremium} onChange={setMinPremium} suffix="$" />
          </div>
        </>
      }
      right={
        <>
          <p className="rounded-md bg-muted/60 p-2 text-caption leading-relaxed text-muted-foreground">
            insured value = (cargo + freight) + 10% (CIF + 10) · premium = max(min, insured × rate%)
          </p>
          <ResultRow label="Cargo + freight (CIF)" value={money(cargoValue + freightCost)} />
          <ResultRow label="Insured value (CIF + 10%)" value={money(insuredValue)} />
          <ResultRow label={`Rate (${ratePct}%)`} value={money((insuredValue * ratePct) / 100)} muted />
          <Separator />
          <ResultRow label="Premium" value={money(premium)} strong />
          {minApplied && (
            <div className="text-right text-caption text-muted-foreground">(minimum premium applied)</div>
          )}
          <ResultActions calcName="Cargo Insurance" summary={`${money(premium)} premium`} />
        </>
      }
    />
  );
}

// ── 13. Customs / duties (US import estimate) ────────────────────────────────
function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function CustomsPanel() {
  const [declaredValue, setDeclaredValue] = useState(85000);
  const [dutyRatePct, setDutyRatePct] = useState(2.5);
  const [brokerageFlat, setBrokerageFlat] = useState(150);

  const duty = (declaredValue * dutyRatePct) / 100;
  const mpf = clamp(declaredValue * 0.003464, 31.67, 614.35);
  const hmf = declaredValue * 0.00125;
  const total = duty + mpf + hmf + brokerageFlat;

  return (
    <TwoCol
      left={
        <>
          <NumberField label="Declared value" value={declaredValue} onChange={setDeclaredValue} suffix="$" />
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Duty rate" value={dutyRatePct} onChange={setDutyRatePct} suffix="%" />
            <NumberField label="Brokerage (flat)" value={brokerageFlat} onChange={setBrokerageFlat} suffix="$" />
          </div>
          <div className="rounded-md bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
            Vehicles typically clear at 2.5% duty. MPF = 0.3464% of value (min {money(31.67)}, max {money(614.35)});
            HMF = 0.125% of value.
          </div>
        </>
      }
      right={
        <>
          <ResultRow label={`Duty (${dutyRatePct}%)`} value={money(duty)} />
          <ResultRow label="MPF (0.3464%, clamped)" value={money(mpf)} />
          <ResultRow label="HMF (0.125%)" value={money(hmf)} />
          <ResultRow label="Brokerage" value={money(brokerageFlat)} />
          <Separator />
          <ResultRow label="Total customs cost" value={money(total)} strong />
          <p className="rounded-md bg-muted/60 p-2 text-caption leading-relaxed text-muted-foreground">
            Estimate only — actual duty is HS-code dependent and may include AD/CVD or section tariffs.
          </p>
          <ResultActions calcName="Customs / Import Duty" summary={`${money(total)} total`} />
        </>
      }
    />
  );
}

// ── Switch ───────────────────────────────────────────────────────────────────
export function CalculatorPanel({ id }: { id: CalculatorId }) {
  switch (id) {
    case "trucking":
      return <TruckingPanel />;
    case "roro":
      return <RoRoPanel />;
    case "loading":
      return <LoadingPanel />;
    case "drayage":
      return <DrayagePanel />;
    case "ocean-freight":
      return <OceanFreightPanel />;
    case "shipping-lines":
      return <ShippingLinesPanel />;
    case "oog":
      return <OogPanel />;
    case "cbm":
      return <CbmPanel />;
    case "equipment-dims":
      return <EquipmentDimsPanel />;
    case "air-freight":
      return <AirFreightPanel />;
    case "demurrage":
      return <DemurragePanel />;
    case "insurance":
      return <InsurancePanel />;
    case "customs":
      return <CustomsPanel />;
    default: {
      const meta = getCalculator(id);
      return <p className="text-sm text-muted-foreground">Calculator “{meta?.name ?? id}” is not available.</p>;
    }
  }
}
