"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Info, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionBar } from "@/components/ui/action-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RequiredMark } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LocationCombobox, type LocationValue } from "@/components/location-combobox";
import { CommodityPicker, type CommoditySelection } from "@/components/commodity-picker";
import { RouteOverviewCard, CommodityDetailsCard } from "@/components/shipment-context-cards";
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
    condition: commodity.condition,
    dimensions: commodity.equipmentId ? undefined : commodity.dimensions,
  };
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
  // Safety net (templates, restored drafts, imported/stale/URL state): the UI
  // disables the duplicate option, but guard against identical values anyway.
  if (origin && dest && origin.id === dest.id) {
    e.origin = "Origin and destination must be different locations.";
    e.dest = "Origin and destination must be different locations.";
  }
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
  /* Extended search is no longer a switch — it is explained in the Schedule &
     rate sources section instead — so the flag is a CONSTANT, not seeded state.

     It must not read `initial.advanced`: a prefilled form (Back to shipping
     details, Edit shipping details, any History deep link — quote-links.ts
     encodes advancedSearch: false) would then submit false while the section
     above it still says "Extended search included", which is exactly the lie
     this copy must never tell. The old Switch could not lie because it showed
     the real flag; a sentence can, so the flag is pinned to match it.

     CONSEQUENCE, the one non-visual effect in this change: a search widens to
     8 rate options across contract, tariff, live-API and spot sources rather
     than 5 contract/tariff ones (lib/quote-engine.ts:193-196). Reverting means
     restoring the control, not just this line. Flagged for product. */
  const advanced = true;
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

  const dirty = !!(origin || dest || commodity || loadingDate);
  const snapshot = JSON.stringify({ o: origin, d: dest, c: commodity, a: advanced, l: loadingDate });
  const editedSinceSeed = initialSnapshotRef.current === null || snapshot !== initialSnapshotRef.current;

  // No cross-visit persistence: opening the flow fresh always starts blank, like a
  // first-time user. Values are only restored from the URL when returning from
  // results/editing (the `initial` prop), never from a previous session's draft.

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
  const ctaLabel = existingQuery && candidateQuery && candidateQuery !== existingQuery ? "Update rates" : "Check rates";

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
    setLoadingDate("");
    setErrors({});
  };

  const routeComplete = !!(origin && dest);

  return (
    <div className={cn("flex flex-1 flex-col gap-6", className)}>
      <div className="grid items-start gap-6 lg:grid-cols-12">
      {/* ── Form column ── */}
      <Card className="lg:col-span-7">
        <CardContent className="space-y-7 p-5 sm:p-6">
          {/* 1 · Route */}
          <section aria-labelledby="rq-route-heading" className="space-y-4">
            <div>
              <h3 id="rq-route-heading" className="text-lg font-semibold">Route</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Where the shipping starts and ends — pick a port or a door address for each.
              </p>
            </div>
            <div ref={originAnchor} className="grid items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
              <div id="rq-origin" className="space-y-1.5">
                <Label htmlFor="rq-origin-trigger"><span>Origin<RequiredMark /></span></Label>
                <LocationCombobox id="rq-origin-trigger" value={origin} onChange={setOrigin} disabledId={dest?.id} disabledReason="Selected as destination" menuAlign="start" placeholder="Port or pickup address…" />
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
                <LocationCombobox id="rq-dest-trigger" value={dest} onChange={setDest} disabledId={origin?.id} disabledReason="Selected as origin" menuAlign="end" placeholder="Port or delivery address…" />
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
              className="space-y-6 duration-300 animate-in fade-in slide-in-from-top-1"
            >
              <Separator />
              <div>
                <h3 id="rq-commodity-heading" className="text-lg font-semibold">Commodity</h3>
                <p className="mt-1 text-xs text-muted-foreground">
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
            <section aria-labelledby="rq-schedule-heading" className="space-y-4 duration-300 animate-in fade-in slide-in-from-top-1">
              <Separator />
              {/* The same shape as Route and Commodity above: a heading, one
                  line of supporting text, then the fields. The tinted bordered
                  block is gone — this section is not special, and the tint was
                  the only thing claiming it was. */}
              <div>
                <h3 id="rq-schedule-heading" className="text-lg font-semibold">Schedule &amp; rate sources</h3>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Extended search included — contract, tariff, live carrier APIs and spot.</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label="What is extended search?"
                        className="inline-flex rounded-full text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        <Info aria-hidden className="size-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Extended search also queries live Shipping Line APIs and spot-market sources
                      for more rate options, on top of your contract and offline tariff rates.
                    </TooltipContent>
                  </Tooltip>
                </p>
              </div>
              {/* Optional, and left unmarked: this form annotates what is
                  REQUIRED, so anything without an asterisk is already optional. */}
              <div className="space-y-1.5">
                <Label htmlFor="rq-loading-date" className="text-sm">Loading date</Label>
                <Input id="rq-loading-date" type="date" value={loadingDate} onChange={(e) => setLoadingDate(e.target.value)} className="h-10 w-full sm:w-56" />
              </div>
            </section>
          )}

        </CardContent>
      </Card>

      {/* ── Context panel (desktop) ── */}
      <aside className="sticky top-20 hidden space-y-4 self-start lg:col-span-5 lg:block" aria-label="Shipping summary">
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

      {/* The step's actions, held at the bottom of the viewport.
          A SIBLING of the grid, not a cell in it: sticky travels only inside
          its parent's content box, and a grid item alone in its row is
          exactly as tall as the bar — 8px of travel, so it never pinned.

          Nothing to act on until there is a route: before an origin and a
          destination exist the step has no action to offer, so the bar stays
          away rather than presenting a button that can only be refused. */}
      {routeComplete && (
      <ActionBar
        aside={
          dirty && !loading ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="gap-1.5 text-muted-foreground">
                  <RotateCcw className="size-4" /> Start over
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear the entered shipping details?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The route, commodity, and shipping details you entered will be removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep editing</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAll}>Clear form</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : undefined
        }
      >
        {/* Enabled whatever is still missing. Pressing it validates, marks the
            incomplete fields and moves focus to the first of them — which
            tells the reader WHICH field is wrong, where a disabled button can
            only say that something is. */}
        <Button onClick={submit} disabled={loading} aria-busy={loading} className="sm:min-w-48">
          {loading ? (
            <>
              <Spinner className="size-4" /> Checking available rates…
            </>
          ) : (
            ctaLabel
          )}
        </Button>
      </ActionBar>
      )}
    </div>
  );
}
