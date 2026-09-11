"use client";

import { useMemo, useRef, useState } from "react";
import { Route, Wand2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { StepBackButton } from "@/components/step-back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FlowProgress, type FlowStep } from "@/components/quote/flow-progress";
import { ShipmentSummary } from "@/components/quote/shipment-summary";
import { RouteShipmentStep } from "@/components/route/route-shipment-step";
import { RouteStagesStep } from "@/components/route/route-stages-step";
import { PricingStep } from "@/components/quote/pricing-step";
import { ReviewStep } from "@/components/quote/review-step";
import { usePricingModel, type QuoteMeta } from "@/components/quote/pricing-parts";
import { exampleLegs, LEG_TO_QUOTE, routeSearchInput } from "@/components/route/route-data";
import { money, seeded } from "@/lib/format";
import type { LocationValue } from "@/components/location-combobox";
import type { CommoditySelection } from "@/components/commodity-picker";
import type { QuoteLeg, RouteStep } from "@/lib/types";

const STEPS: FlowStep[] = [
  { key: "shipment", label: "Shipping details" },
  { key: "build", label: "Build route" },
  { key: "pricing", label: "Set pricing" },
  { key: "review", label: "Review & send" },
];

const OVERSIZE = ["Flatrack", "Breakbulk", "RoRo"];

export function RouteBuilder() {
  const [commodity, setCommodity] = useState<CommoditySelection | undefined>(undefined);
  const [origin, setOrigin] = useState<LocationValue | undefined>(undefined);
  const [destination, setDestination] = useState<LocationValue | undefined>(undefined);
  const [steps, setSteps] = useState<RouteStep[]>([]);
  const [step, setStep] = useState(0);

  // route → priceable legs (ocean keeps its surcharge breakdown; others collapse to a flat line)
  const routeQuoteLegs = useMemo<QuoteLeg[]>(
    () => steps.map((s) => ({
      id: s.id, kind: LEG_TO_QUOTE[s.kind], title: s.title, from: s.location ?? "", to: s.toLocation ?? s.location ?? "",
      vendorId: s.vendorId, carrierId: s.carrierId, dataSourceId: s.dataSourceId, included: true,
      charges: s.charges?.length ? s.charges : [{ id: `c-${s.id}`, name: s.title, basis: "Flat", qty: 1, currency: "USD", unitCost: Number(s.cost) || 0 }],
    })),
    [steps],
  );
  // Signature over the full priceable content (id, title, endpoints, vendor/carrier,
  // and charge costs) so ANY route edit — not just a cost change — refreshes the
  // priced legs when re-entering pricing.
  const routeSig = useMemo(() => JSON.stringify(routeQuoteLegs), [routeQuoteLegs]);

  const model = usePricingModel(routeQuoteLegs);
  const pricedSigRef = useRef<string>("");

  const totalCost = useMemo(() => steps.reduce((s, st) => s + (Number(st.cost) || 0), 0), [steps]);
  const totalDays = useMemo(() => steps.reduce((s, st) => s + (Number(st.durationDays) || 0), 0), [steps]);
  const oceanLeg = steps.find((s) => s.kind === "ocean");
  const isOversize = !!commodity && (OVERSIZE.includes(commodity.shipmentType) || commodity.kind === "oog");
  const shipmentComplete = !!(origin && destination && commodity && (commodity.kind === "equipment" ? commodity.equipmentId : commodity.label.trim()));

  const input = routeSearchInput(origin, destination, commodity);
  const quoteId = `Q-${190700 + Math.floor(seeded((commodity?.label ?? "") + (origin?.id ?? "") + (destination?.id ?? "")) * 200)}`;

  const meta: QuoteMeta = {
    quoteId,
    origin: origin?.label ?? "Origin",
    destination: destination?.label ?? "Destination",
    commodityLabel: commodity?.label || commodity?.kind || "Cargo",
    commodityKind: commodity?.kind ?? "equipment",
    shipmentType: commodity?.shipmentType ?? "Container",
    currency: "USD",
    validTo: "2026-09-30",
    transitDays: totalDays,
    carrierId: oceanLeg?.carrierId,
  };

  const saveDraft = () => toast.success("Draft saved", { description: `${quoteId} · ${meta.origin} → ${meta.destination} saved to history.` });

  // Enter pricing — refresh the priced legs whenever the route changed since it was
  // last priced. syncLegs preserves the manager's profit settings, so a
  // pricing↔review round-trip (or a rename/reorder) keeps profit while still
  // reflecting the current stages, costs, and labels.
  const goToPricing = () => {
    if (routeSig !== pricedSigRef.current) {
      model.syncLegs(routeQuoteLegs);
      pricedSigRef.current = routeSig;
    }
    setStep(2);
  };

  const onStepClick = (i: number) => {
    if (i >= step) return;
    if (i === 2) goToPricing();
    else setStep(i);
  };

  const loadSample = () => {
    setCommodity({ kind: "equipment", label: "John Deere S780 Combine", equipmentId: "e-jd-s770", industry: "Farm", category: "Harvesters", make: "John Deere", dimensions: { lengthIn: 372, widthIn: 152, heightIn: 158, weightLb: 38500 }, container: "40FR", shipmentType: "Flatrack" });
    setOrigin({ kind: "address", id: "a-charleston", label: "Charleston, IL 61920" });
    setDestination({ kind: "address", id: "a-baku", label: "Baku, Azerbaijan" });
    setSteps(exampleLegs());
    pricedSigRef.current = "";
    setStep(1);
    toast.success("Loaded sample route", { description: "Combine · US → Baku" });
  };

  const back =
    step === 1 ? { label: "Back to shipping details", onClick: () => setStep(0) }
    : step === 2 ? { label: "Back to route", onClick: () => setStep(1) }
    : step === 3 ? { label: "Back to pricing", onClick: () => setStep(2) }
    : null;

  const pricingSummary = (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="text-caption font-medium uppercase tracking-wide text-muted-foreground">Custom route</div>
        <div className="text-sm font-medium">{steps.length} stage{steps.length === 1 ? "" : "s"} · {totalDays} days</div>
        <div className="truncate text-xs text-muted-foreground">{meta.origin} → {meta.destination}</div>
      </div>
      <div className="shrink-0 text-left sm:text-right">
        <div className="text-caption uppercase tracking-wide text-muted-foreground">Internal cost</div>
        <div className="text-xl font-bold tabular-nums">{money(model.calc.internalCost)}</div>
        <div className="text-caption text-muted-foreground">Before profit · USD</div>
      </div>
    </Card>
  );

  const reviewReminder = (
    <Card className="flex flex-row items-center gap-2 p-3 text-xs text-muted-foreground">
      <Route className="size-4 shrink-0 text-primary" /> Custom route · {steps.length} stage{steps.length === 1 ? "" : "s"} · {totalDays} days
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Route"
        description="Build and price transportation stages manually using vendors, contracts, and AI-assisted sourcing."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground"><MoreHorizontal className="size-4" /> More</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>More actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={loadSample}><Wand2 className="size-4" /> Load sample route</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>

      {/* Same order as Rate Quote: the way back, then the map, then the
          context. Shared components, Custom Route's own steps and labels. */}
      {back && step > 0 && input && (
        <StepBackButton label={back.label} onClick={back.onClick} />
      )}

      <FlowProgress steps={STEPS} current={step} onStepClick={onStepClick} ariaLabel="Custom route progress" />

      {/* Set pricing pairs the summary with the route card instead. */}
      {step > 0 && input && step !== 2 && (
        <ShipmentSummary input={input} onEdit={() => setStep(0)} />
      )}

      {step === 0 && (
        <RouteShipmentStep
          origin={origin} setOrigin={setOrigin}
          destination={destination} setDestination={setDestination}
          commodity={commodity} setCommodity={setCommodity}
          hasStages={steps.length > 0}
          onContinue={() => setStep(1)}
          onSaveDraft={saveDraft}
        />
      )}

      {step === 1 && (
        <RouteStagesStep
          steps={steps} setSteps={setSteps}
          origin={origin} destination={destination}
          shipmentType={meta.shipmentType}
          shipmentComplete={shipmentComplete}
          isOversize={isOversize}
          onContinue={goToPricing}
          onSaveDraft={saveDraft}
        />
      )}

      {step === 2 && (
        <PricingStep
          model={model}
          meta={meta}
          summary={pricingSummary}
          context={input ? <ShipmentSummary input={input} onEdit={() => setStep(0)} /> : undefined}
          editableCosts={false}
          servicesLabel="Route stages"
          onReview={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <ReviewStep
          model={model}
          meta={meta}
          reminder={reviewReminder}
          templateKindLabel="route configuration"
          onBackToPricing={() => setStep(2)}
        />
      )}
    </div>
  );
}
