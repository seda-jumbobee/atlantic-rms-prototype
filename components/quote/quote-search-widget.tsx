"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Anchor, ArrowLeftRight, CalendarDays, MapPin, RotateCcw, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LocationCombobox, type LocationValue } from "@/components/location-combobox";
import {
  CommodityPicker, RequiredMark, COMMODITY_KIND_LABEL, type CommoditySelection,
} from "@/components/commodity-picker";
import { MapPreview, type MapPoint } from "@/components/map-preview";
import { PORTS, ADDRESSES } from "@/lib/data/ports";
import { CONTAINER_LABEL } from "@/lib/data/containers";
import type { SearchInput } from "@/lib/quote-engine";
import { encodeSearch } from "@/lib/search-params";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "rms.rate-quote.draft";

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
    condition: commodity.condition,
    dimensions: commodity.equipmentId ? undefined : commodity.dimensions,
  };
}

function shortLoc(v: LocationValue): string {
  return v.label.split("·")[0].split(",").slice(0, 2).join(",").trim();
}

function mapPoint(v?: LocationValue): MapPoint | undefined {
  if (!v) return undefined;
  const rec = v.kind === "port" ? PORTS.find((p) => p.id === v.id) : ADDRESSES.find((a) => a.id === v.id);
  return rec ? { lat: rec.lat, lng: rec.lng, label: shortLoc(v) } : undefined;
}

/** Emoji flag derived from the location's ISO country code (dynamic per selection). */
function flagEmoji(v?: LocationValue): string | null {
  if (!v) return null;
  const rec = v.kind === "port" ? PORTS.find((p) => p.id === v.id) : ADDRESSES.find((a) => a.id === v.id);
  const cc = rec?.countryCode;
  if (!cc || cc.length !== 2) return null;
  return String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function LocationRow({ label, value }: { label: string; value: LocationValue }) {
  const Icon = value.kind === "port" ? Anchor : MapPin;
  return (
    <div className="flex items-center gap-2 text-sm">
      <dt className="w-20 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1.5 font-medium">
        <Icon aria-hidden className="size-3.5 shrink-0 text-primary" />
        {flagEmoji(value) && <span aria-hidden className="shrink-0 text-sm leading-none">{flagEmoji(value)}</span>}
        <span className="truncate">{value.label}</span>
      </dd>
    </div>
  );
}

type FieldErrors = Partial<Record<"origin" | "dest" | "kind" | "details" | "dims", string>>;

function validateForm(
  origin: LocationValue | undefined,
  dest: LocationValue | undefined,
  commodity: CommoditySelection | undefined,
): FieldErrors {
  const e: FieldErrors = {};
  if (!origin) e.origin = "Select an origin";
  if (!dest) e.dest = "Select a destination";
  if (origin && dest && origin.id === dest.id) e.dest = "Origin and destination must be different";
  if (!commodity) {
    e.kind = "Choose a commodity type";
    return e;
  }
  if (commodity.kind === "equipment") {
    if (!commodity.equipmentId) e.details = "Complete the required commodity details";
  } else if (!commodity.label.trim()) {
    e.details = "Complete the required commodity details";
  }
  const d = commodity.dimensions;
  if (d) {
    if ([d.lengthIn, d.widthIn, d.heightIn].some((x) => x < 0)) e.dims = "Enter a value greater than zero";
    if (d.weightLb < 0) e.dims = "Enter a valid weight";
  }
  return e;
}

/* ── Context summary cards (desktop side panel + inline on smaller screens) ── */

function RouteOverviewCard({ origin, dest }: { origin: LocationValue; dest: LocationValue }) {
  const o = mapPoint(origin);
  const d = mapPoint(dest);
  return (
    <Card className="gap-3 p-4">
      <CardHeader className="p-0">
        <CardTitle className="text-base font-semibold">Route overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        <dl className="space-y-1.5">
          <LocationRow label="Origin" value={origin} />
          <LocationRow label="Destination" value={dest} />
        </dl>
        {o && d && <MapPreview origin={o} destination={d} className="h-44" />}
      </CardContent>
    </Card>
  );
}

function CommodityDetailsCard({ commodity }: { commodity: CommoditySelection }) {
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
    <Card className="gap-3 p-4">
      <CardHeader className="p-0">
        <CardTitle className="text-base font-semibold">Commodity details</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <dl className="space-y-1.5 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 text-muted-foreground">{k}</dt>
              <dd className="min-w-0 break-words text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export function QuoteSearchWidget({
  initial,
  existingQuery,
  onSearch,
  className,
}: {
  initial?: Partial<{ origin: LocationValue; dest: LocationValue; commodity: CommoditySelection; advanced: boolean; loadingDate: string }>;
  /** Encoded query of already-loaded results — switches the CTA to "Update rates" when criteria change. */
  existingQuery?: string;
  onSearch?: (input: SearchInput) => void;
  className?: string;
}) {
  const router = useRouter();
  const [origin, setOrigin] = useState<LocationValue | undefined>(initial?.origin);
  const [dest, setDest] = useState<LocationValue | undefined>(initial?.dest);
  const [commodity, setCommodity] = useState<CommoditySelection | undefined>(initial?.commodity);
  const [advanced, setAdvanced] = useState(initial?.advanced ?? false);
  const [loadingDate, setLoadingDate] = useState(initial?.loadingDate ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const submittedRef = useRef(false);
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originAnchor = useRef<HTMLDivElement>(null);
  // Snapshot of the seeded values: skip draft-saving / leave-warnings until the user actually edits.
  const initialSnapshotRef = useRef<string | null>(
    initial ? JSON.stringify({ o: initial.origin, d: initial.dest, c: initial.commodity, a: initial.advanced ?? false, l: initial.loadingDate ?? "" }) : null,
  );

  const dirty = !!(origin || dest || commodity || loadingDate || advanced);
  const snapshot = JSON.stringify({ o: origin, d: dest, c: commodity, a: advanced, l: loadingDate });
  const editedSinceSeed = initialSnapshotRef.current === null || snapshot !== initialSnapshotRef.current;

  // Session-local draft (no backend persistence in this prototype): restore once, save on change.
  useEffect(() => {
    if (initial) return;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.origin) setOrigin(d.origin);
      if (d.dest) setDest(d.dest);
      if (d.commodity) setCommodity(d.commodity);
      if (d.advanced) setAdvanced(d.advanced);
      if (d.loadingDate) setLoadingDate(d.loadingDate);
    } catch { /* corrupt draft — start clean */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!dirty || !editedSinceSeed) return; // never clobber a fresh-form draft with untouched seeded values
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ origin, dest, commodity, advanced, loadingDate }));
    } catch { /* storage full/unavailable */ }
  }, [origin, dest, commodity, advanced, loadingDate, dirty, editedSinceSeed]);

  // Warn before leaving the page with unsaved criteria (skipped right after submit
  // and on a prefilled form the user hasn't touched).
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty && editedSinceSeed && !submittedRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, editedSinceSeed]);

  // Cancel a pending submit transition if the user navigates away first.
  useEffect(() => () => {
    if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
  }, []);

  // Live re-validation: clear an error as soon as its field becomes valid.
  useEffect(() => {
    setErrors((prev) => {
      if (!Object.keys(prev).length) return prev;
      const fresh = validateForm(origin, dest, commodity);
      const kept: FieldErrors = {};
      for (const k of Object.keys(prev) as (keyof FieldErrors)[]) if (fresh[k]) kept[k] = fresh[k];
      return kept;
    });
  }, [origin, dest, commodity]);

  const swap = () => { setOrigin(dest); setDest(origin); };

  const candidateQuery = useMemo(
    () => (origin && dest && commodity ? encodeSearch(buildInput(origin, dest, commodity, advanced, loadingDate)) : null),
    [origin, dest, commodity, advanced, loadingDate],
  );
  const ctaLabel = existingQuery && candidateQuery && candidateQuery !== existingQuery ? "Update rates" : "Find rates";

  const focusSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.querySelector<HTMLElement>("button, input, [tabindex]")?.focus({ preventScroll: true });
  }, []);

  const submit = () => {
    if (loading) return;
    const e = validateForm(origin, dest, commodity);
    if (Object.keys(e).length) {
      setErrors(e);
      const first = e.origin ? "rq-origin" : e.dest ? "rq-dest" : e.kind ? "rq-commodity" : "rq-details";
      focusSection(first);
      return;
    }
    setErrors({});
    const input = buildInput(origin!, dest!, commodity!, advanced, loadingDate);
    submittedRef.current = true;
    if (onSearch) return onSearch(input);
    setLoading(true);
    // Brief transition state — rate assembly is synchronous in the prototype.
    submitTimerRef.current = setTimeout(() => router.push(`/quote-master?${encodeSearch(input)}`), 650);
  };

  const clearAll = () => {
    setOrigin(undefined);
    setDest(undefined);
    setCommodity(undefined);
    setAdvanced(false);
    setLoadingDate("");
    setErrors({});
    try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
  };

  const routeComplete = !!(origin && dest);

  return (
    <div className={cn("grid items-start gap-6 lg:grid-cols-12", className)}>
      {/* ── Form column ── */}
      <Card className="lg:col-span-7">
        <CardContent className="space-y-7 p-5 sm:p-6">
          {/* 1 · Route */}
          <section aria-labelledby="rq-route-heading" className="space-y-4">
            <h3 id="rq-route-heading" className="text-base font-semibold">Route</h3>
            <div ref={originAnchor} className="grid items-start gap-3 sm:grid-cols-[1fr_auto_1fr]">
              <div id="rq-origin" className="space-y-1.5">
                <Label htmlFor="rq-origin-trigger"><span>Origin<RequiredMark /></span></Label>
                <LocationCombobox id="rq-origin-trigger" value={origin} onChange={setOrigin} placeholder="Port or pickup address…" />
                {errors.origin && <p role="alert" className="text-xs font-medium text-destructive">{errors.origin}</p>}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Swap origin and destination"
                    className="mt-7 hidden shrink-0 text-muted-foreground hover:text-foreground sm:inline-flex"
                    onClick={swap}
                  >
                    <ArrowLeftRight className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Swap origin and destination</TooltipContent>
              </Tooltip>
              <div id="rq-dest" className="space-y-1.5">
                <Label htmlFor="rq-dest-trigger"><span>Destination<RequiredMark /></span></Label>
                <LocationCombobox id="rq-dest-trigger" value={dest} onChange={setDest} placeholder="Port or delivery address…" />
                {errors.dest && <p role="alert" className="text-xs font-medium text-destructive">{errors.dest}</p>}
              </div>
            </div>
          </section>

          {/* Inline route summary on smaller screens */}
          {routeComplete && (
            <div className="lg:hidden">
              <RouteOverviewCard origin={origin!} dest={dest!} />
            </div>
          )}

          {/* 2 · Commodity — revealed once the route is complete */}
          {routeComplete && (
            <section
              id="rq-commodity"
              aria-labelledby="rq-commodity-heading"
              className="space-y-4 duration-300 animate-in fade-in slide-in-from-top-1"
            >
              <Separator />
              <div>
                <h3 id="rq-commodity-heading" className="text-base font-semibold">Commodity</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Commodity type determines which rates and pricing formula will be used.
                </p>
              </div>
              <CommodityPicker
                value={commodity}
                onChange={setCommodity}
                errors={{ kind: errors.kind, details: errors.details, dims: errors.dims }}
                sectionHeadings
              />
            </section>
          )}

          {/* Inline commodity summary on smaller screens */}
          {routeComplete && commodity && (
            <div className="lg:hidden">
              <CommodityDetailsCard commodity={commodity} />
            </div>
          )}

          {/* 3 · Schedule & rate sources — with the commodity chosen */}
          {routeComplete && commodity && (
            <section aria-label="Schedule and rate sources" className="space-y-4 duration-300 animate-in fade-in slide-in-from-top-1">
              <Separator />
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2.5">
                  <Switch checked={advanced} onCheckedChange={setAdvanced} />
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <Sparkles className="size-4 text-primary" /> Extended search
                    <span className="font-normal text-muted-foreground">(Shipping Line APIs & spot sources)</span>
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  <Label htmlFor="rq-loading-date" className="text-sm text-muted-foreground">Loading date</Label>
                  <Input id="rq-loading-date" type="date" value={loadingDate} onChange={(e) => setLoadingDate(e.target.value)} className="h-9 w-auto" />
                </div>
              </div>
            </section>
          )}

          {/* Primary action */}
          <div className="space-y-2 pt-1">
            <Button size="lg" className="w-full gap-2" onClick={submit} disabled={loading} aria-busy={loading}>
              {loading ? (
                <>
                  <Spinner className="size-4" /> Finding available rates…
                </>
              ) : (
                <>
                  <Search className="size-4" /> {ctaLabel}
                </>
              )}
            </Button>
            {dirty && !loading && (
              <div className="flex justify-center">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                      <RotateCcw className="size-3.5" /> Start over
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear the entered shipment details?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The route, commodity, and shipment details you entered will be removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep editing</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAll}>Clear form</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Context panel (desktop) ── */}
      <aside className="sticky top-20 hidden space-y-4 self-start lg:col-span-5 lg:block" aria-label="Shipment summary">
        {routeComplete && (
          <div className="duration-300 animate-in fade-in">
            <RouteOverviewCard origin={origin!} dest={dest!} />
          </div>
        )}
        {routeComplete && commodity && (
          <div className="duration-300 animate-in fade-in">
            <CommodityDetailsCard commodity={commodity} />
          </div>
        )}
      </aside>
    </div>
  );
}
