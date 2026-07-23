"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Search, ListChecks, Calculator, Send, SearchX, Route, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { QuoteSearchWidget } from "@/components/quote/quote-search-widget";
import { ResultsView } from "@/components/quote/results-view";
import { QuotePricingFlow } from "@/components/quote/quote-pricing-flow";
import { ShipmentSummary } from "@/components/quote/shipment-summary";
import type { LocationValue } from "@/components/location-combobox";
import type { CommoditySelection } from "@/components/commodity-picker";
import { decodeSearch, encodeSearch } from "@/lib/search-params";
import { buildRateOptions, destinationRequirements, type SearchInput } from "@/lib/quote-engine";
import { getPort, getAddress } from "@/lib/data/ports";
import { getEquipment } from "@/lib/data/equipment";
import { seeded } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RateOption } from "@/lib/types";

function locLabel(portId?: string, addrId?: string): string {
  const p = getPort(portId);
  if (p) return `${p.name}, ${p.country}`;
  const a = getAddress(addrId);
  return a?.city ?? a?.label ?? "—";
}

// Rebuild the search form's values from an encoded search so "Edit shipment details"
// returns the Manager to a fully pre-filled form (nothing entered is lost).
function widgetInitialFromInput(input: SearchInput) {
  const toLoc = (portId?: string, addrId?: string): LocationValue | undefined => {
    const p = getPort(portId);
    if (p) return { kind: "port", id: p.id, label: `${p.name}, ${p.country} · ${p.locode}` };
    const a = getAddress(addrId);
    if (a) return { kind: "address", id: a.id, label: a.label };
    return undefined;
  };
  const eq = getEquipment(input.equipmentId);
  const selfPropelled = ["equipment", "vehicle", "boat"].includes(input.commodityKind);
  const commodity: CommoditySelection = {
    kind: input.commodityKind,
    label: input.commodityLabel,
    shipmentType: input.shipmentType,
    container: input.container,
    equipmentId: input.equipmentId,
    industry: eq?.industry,
    category: eq?.category,
    make: eq?.make,
    dimensions: input.dimensions ?? eq?.dimensions,
    condition: input.condition ?? (selfPropelled ? "operable" : undefined),
  };
  return {
    origin: toLoc(input.originPortId, input.originAddressId),
    dest: toLoc(input.destPortId, input.destAddressId),
    commodity,
    advanced: input.advancedSearch,
    loadingDate: input.loadingDate ?? "",
  };
}

const STEPS = [
  { key: "search", label: "Shipment details", icon: Search },
  { key: "choose", label: "Choose rate", icon: ListChecks },
  { key: "pricing", label: "Set pricing", icon: Calculator },
  { key: "review", label: "Review & send", icon: Send },
];

export function QuoteMaster() {
  const sp = useSearchParams();
  const router = useRouter();
  const input = useMemo(() => decodeSearch(sp), [sp]);
  const [selected, setSelected] = useState<RateOption | null>(null);
  // Set pricing → Review & send (the pricing state itself lives in QuotePricingFlow).
  const [reviewing, setReviewing] = useState(false);
  // Revisit the search form while results already exist (values pre-filled).
  const [editingSearch, setEditingSearch] = useState(false);

  const rates = useMemo(() => (input ? buildRateOptions(input) : []), [input]);
  const requirements = useMemo(() => (input ? destinationRequirements(input) : []), [input]);

  // ?edit=1 → reopen straight into the editable editor (edit a quoted rate & re-send).
  // Consumed once so "Back to rates" / the stepper still work afterwards.
  const editFlag = sp.get("edit") === "1";
  const editConsumedRef = useRef(false);
  useEffect(() => {
    if (editFlag && !editConsumedRef.current && input && !selected && rates.length) {
      editConsumedRef.current = true;
      setSelected(rates.find((r) => r.recommended) ?? rates[0]);
    }
  }, [editFlag, input, rates, selected]);

  // A new search landed → leave edit mode and show its results.
  const spString = sp.toString();
  useEffect(() => {
    setEditingSearch(false);
    setReviewing(false);
    // A genuinely new search (or landing on the blank form) must drop any rate
    // picked for a previous lane, so we never render pricing for a mismatched
    // shipment. Skip only for the ?edit=1 deep-link, whose effect sets `selected`.
    if (!editFlag) setSelected(null);
  }, [spString, editFlag]);

  const showSearch = !input || editingSearch;
  const stepIndex = showSearch ? 0 : selected ? (reviewing ? 3 : 2) : 1;
  const origin = input ? locLabel(input.originPortId, input.originAddressId) : "";
  const destination = input ? locLabel(input.destPortId, input.destAddressId) : "";
  const quoteId = input ? `Q-${190600 + Math.floor(seeded(JSON.stringify(input)) * 380)}` : "Q-190600";

  const goToStep = (i: number) => {
    if (i >= stepIndex) return;
    if (i <= 2) setReviewing(false); // leaving Review to any earlier step
    if (i === 0) setEditingSearch(true);
    if (i === 1) setSelected(null);
  };

  // Per-step back navigation (kept in the same place across all steps).
  const back =
    stepIndex === 1
      ? { label: "Back to shipment details", onClick: () => setEditingSearch(true) }
      : stepIndex === 2
        ? { label: "Back to rates", onClick: () => setSelected(null) }
        : stepIndex === 3
          ? { label: "Back to pricing", onClick: () => setReviewing(false) }
          : null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Rate Quote"
        description="Find available rates and create a client quote using commodity-specific formulas and contract rates."
      />

      {/* Shared back navigation + shipment summary — consistent across Choose rate,
          Set pricing, and Review & send so the Manager always knows the context. */}
      {input && !showSearch && (
        <div className="space-y-4">
          {back && (
            <button
              type="button"
              onClick={back.onClick}
              className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-primary outline-none transition hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <ArrowLeft className="size-4" /> {back.label}
            </button>
          )}
          <ShipmentSummary input={input} onEdit={() => setEditingSearch(true)} />
        </div>
      )}

      {/* Progress — full main-content width. */}
      <nav aria-label="Quote progress" className="w-full">
        <ol className="flex w-full items-center gap-2 sm:gap-3">
          {STEPS.map((s, i) => {
            const state = i === stepIndex ? "active" : i < stepIndex ? "done" : "upcoming";
            const clickable = state === "done";
            const Inner = (
              <>
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full text-xs font-medium transition",
                    state === "active" && "bg-primary text-primary-foreground",
                    state === "done" && "bg-primary/15 text-primary",
                    state === "upcoming" && "bg-muted text-muted-foreground",
                  )}
                >
                  {state === "done" ? <Check className="size-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "hidden whitespace-nowrap text-sm md:inline",
                    state === "active" && "font-semibold text-foreground",
                    state === "done" && "font-medium text-foreground",
                    state === "upcoming" && "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </>
            );
            return (
              <li key={s.key} className={cn("flex min-w-0 items-center gap-2 sm:gap-3", i < STEPS.length - 1 && "flex-1")}>
                {clickable ? (
                  <button
                    type="button"
                    onClick={() => goToStep(i)}
                    className="flex items-center gap-2 rounded-full outline-none transition hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    aria-label={`Back to ${s.label}`}
                  >
                    {Inner}
                  </button>
                ) : (
                  <div className="flex items-center gap-2" aria-current={state === "active" ? "step" : undefined}>
                    {Inner}
                  </div>
                )}
                {i < STEPS.length - 1 && (
                  <span aria-hidden className={cn("h-0.5 min-w-4 flex-1 rounded-full", i < stepIndex ? "bg-primary" : "bg-border")} />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {showSearch && (
        <QuoteSearchWidget
          key={input ? spString : "fresh"}
          initial={input ? widgetInitialFromInput(input) : undefined}
          existingQuery={input ? encodeSearch(input) : undefined}
          onSearch={
            input
              ? (next) => {
                  // Unchanged criteria → back to the existing results; changed → new search.
                  const q = encodeSearch(next);
                  if (q === encodeSearch(input)) setEditingSearch(false);
                  else {
                    // a different lane/commodity invalidates the picked rate & pricing
                    setSelected(null);
                    setReviewing(false);
                    router.push(`/quote-master?${q}`);
                  }
                }
              : undefined
          }
        />
      )}

      {!showSearch && stepIndex === 1 && input && (
        rates.length ? (
          <ResultsView
            rates={rates}
            requirements={requirements}
            lane={`${origin} → ${destination}`}
            advanced={input.advancedSearch}
            onSelect={setSelected}
            onEditShipment={() => setEditingSearch(true)}
          />
        ) : (
          <EmptyState
            icon={SearchX}
            title="No matching rates found"
            description="We could not find a rate for the selected route and shipment details. Adjust the shipment details, or price the transportation stages manually in Custom Route."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => setEditingSearch(true)}>Edit shipment details</Button>
                <Button variant="outline" asChild>
                  <Link href="/route-builder"><Route className="size-4" /> Build custom route</Link>
                </Button>
              </div>
            }
            className="mx-auto max-w-lg"
          />
        )
      )}

      {/* Kept mounted (just hidden) while editing shipment details, so pricing work
          survives an unchanged edit round-trip; a changed search clears `selected`
          above, which unmounts and resets it. */}
      {selected && input && (
        <div className={showSearch ? "hidden" : undefined}>
          <QuotePricingFlow
            key={selected.id}
            rate={selected}
            quoteId={quoteId}
            origin={origin}
            destination={destination}
            commodityLabel={input.commodityLabel || input.commodityKind}
            shipmentType={input.shipmentType}
            reviewing={reviewing}
            onReview={() => setReviewing(true)}
            onBackToPricing={() => setReviewing(false)}
          />
        </div>
      )}
    </div>
  );
}
