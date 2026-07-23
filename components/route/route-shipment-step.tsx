"use client";

import { useState } from "react";
import { ArrowRight, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LocationCombobox, type LocationValue } from "@/components/location-combobox";
import { CommodityPicker, RequiredMark, type CommoditySelection } from "@/components/commodity-picker";
import { ShipmentSummary } from "@/components/quote/shipment-summary";
import { MapPreview } from "@/components/map-preview";
import { routeSearchInput, pointFromLocation } from "@/components/route/route-data";

type Errors = Partial<Record<"origin" | "dest" | "kind" | "details", string>>;

function validate(origin?: LocationValue, dest?: LocationValue, commodity?: CommoditySelection): Errors {
  const e: Errors = {};
  if (!origin) e.origin = "Select an origin";
  if (!dest) e.dest = "Select a final destination";
  if (origin && dest && origin.id === dest.id) {
    e.origin = "Origin and destination must be different locations.";
    e.dest = "Origin and destination must be different locations.";
  }
  if (!commodity) { e.kind = "Choose a commodity type"; return e; }
  if (commodity.kind === "equipment") {
    if (!commodity.equipmentId) e.details = "Complete the required commodity details";
  } else if (!commodity.label.trim()) {
    e.details = "Complete the required commodity details";
  }
  return e;
}

export function RouteShipmentStep({
  origin, setOrigin, destination, setDestination, commodity, setCommodity,
  hasStages, onContinue, onSaveDraft,
}: {
  origin?: LocationValue;
  setOrigin: (v: LocationValue) => void;
  destination?: LocationValue;
  setDestination: (v: LocationValue) => void;
  commodity?: CommoditySelection;
  setCommodity: (v: CommoditySelection) => void;
  hasStages: boolean;
  onContinue: () => void;
  onSaveDraft: () => void;
}) {
  const [errors, setErrors] = useState<Errors>({});
  // Changing origin/destination when the route already has stages can invalidate
  // them — hold the pending change and confirm first.
  const [pending, setPending] = useState<{ which: "origin" | "dest"; value: LocationValue } | null>(null);

  const routeComplete = !!(origin && destination);
  const input = routeSearchInput(origin, destination, commodity);

  const applyOrigin = (v: LocationValue) => (hasStages ? setPending({ which: "origin", value: v }) : setOrigin(v));
  const applyDest = (v: LocationValue) => (hasStages ? setPending({ which: "dest", value: v }) : setDestination(v));
  const confirmPending = () => {
    if (!pending) return;
    if (pending.which === "origin") setOrigin(pending.value);
    else setDestination(pending.value);
    setPending(null);
  };

  const submit = () => {
    const e = validate(origin, destination, commodity);
    setErrors(e);
    if (Object.keys(e).length === 0) onContinue();
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-12">
      {/* form */}
      <Card className="lg:col-span-7">
        <CardContent className="space-y-7 p-5 sm:p-6">
          {/* Route */}
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Route</h3>
              <p className="mt-1 text-xs text-muted-foreground">Where the shipment starts and ends — pick a port or a door address for each.</p>
            </div>
            <div className="grid items-start gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cr-origin"><span>Origin<RequiredMark /></span></Label>
                <LocationCombobox id="cr-origin" value={origin} onChange={applyOrigin} disabledId={destination?.id} disabledReason="Selected as destination" menuAlign="start" placeholder="Port or pickup address…" />
                {errors.origin && <p role="alert" className="text-xs font-medium text-destructive">{errors.origin}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cr-dest"><span>Final destination<RequiredMark /></span></Label>
                <LocationCombobox id="cr-dest" value={destination} onChange={applyDest} disabledId={origin?.id} disabledReason="Selected as origin" menuAlign="end" placeholder="Port or delivery address…" />
                {errors.dest && <p role="alert" className="text-xs font-medium text-destructive">{errors.dest}</p>}
              </div>
            </div>
          </section>

          {/* Commodity — type shown immediately; details revealed once the route is set */}
          <section className="space-y-6">
            <Separator />
            <div>
              <h3 className="text-lg font-semibold">Commodity</h3>
              <p className="mt-1 text-xs text-muted-foreground">Commodity type helps filter the relevant vendors, contracts, and rate sources.</p>
            </div>
            <CommodityPicker
              value={commodity}
              onChange={setCommodity}
              errors={{ kind: errors.kind, details: errors.details }}
              sectionHeadings
              showDetails={routeComplete}
            />
            {routeComplete === false && commodity && (
              <p className="text-xs text-muted-foreground">Set the origin and final destination to add cargo and shipment details.</p>
            )}
          </section>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <Button variant="outline" className="gap-1.5" onClick={onSaveDraft}><Save className="size-4" /> Save draft</Button>
            <Button className="gap-1.5" onClick={submit}>Continue to build route <ArrowRight className="size-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* live context panel */}
      <aside className="space-y-4 lg:col-span-5 lg:sticky lg:top-20 lg:self-start" aria-label="Shipment preview">
        {input && <ShipmentSummary input={input} />}
        {routeComplete && (
          <Card className="overflow-hidden p-0">
            <CardContent className="p-3">
              <MapPreview origin={pointFromLocation(origin)} destination={pointFromLocation(destination)} className="h-56" />
            </CardContent>
          </Card>
        )}
      </aside>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change the {pending?.which === "origin" ? "origin" : "final destination"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Your route already has stages. Changing the {pending?.which === "origin" ? "origin" : "destination"} may make some of them invalid — you may need to review vendors, rates, and locations afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep current</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPending}>Change it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
