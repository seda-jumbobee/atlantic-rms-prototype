"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  ListOrdered, RotateCcw, DollarSign, Clock, Navigation, Info, ArrowRight, Save,
  CheckCircle2, AlertTriangle, Ship,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActionBar } from "@/components/ui/action-bar";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { StatCard } from "@/components/stat-card";
import { CarrierName } from "@/components/carrier-name";
import { StatusBadge } from "@/components/status-badge";
import { MapPreview } from "@/components/map-preview";
import { AddStepMenu } from "@/components/route/add-step-menu";
import { RouteStageCard } from "@/components/route/route-stage-card";
import { IDLE_AI, type AiState } from "@/components/route/ai-sourcing";
import {
  LEG_KINDS, vendorOptions, defaultsFor, oceanCharges, nextId, pointFromLocation, OCEAN_OFFERS,
} from "@/components/route/route-data";
import { stageStatus, isBlockingStatus, STAGE_STATUS_META } from "@/components/route/route-status";
import { money, fmtDate, seeded, daysFromNow, VESSELS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CARRIERS } from "@/lib/data/carriers";
import type { LocationValue } from "@/components/location-combobox";
import type { RouteStep, RouteStepKind, ShipmentType } from "@/lib/types";

function OceanSearchDialog({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; onPick: (carrierId: string, cost: number, days: number) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Search shipping lines</DialogTitle><DialogDescription>Ocean rates for this stage. Pick a carrier to set the cost &amp; transit.</DialogDescription></DialogHeader>
        <div className="space-y-2">
          {[...OCEAN_OFFERS].sort((a, b) => a.cost - b.cost).map((o, i) => (
            <button key={o.carrierId} onClick={() => onPick(o.carrierId, o.cost, o.days)} className={cn("flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60", i === 0 && "border-primary/40 bg-primary/5")}>
              <div className="flex items-center gap-3"><CarrierName carrierId={o.carrierId} />{i === 0 && <StatusBadge tone="positive" dot={false}>Cheapest</StatusBadge>}</div>
              <div className="flex items-center gap-4 text-sm"><span className="flex items-center gap-1 text-muted-foreground"><Clock className="size-3.5" /> {o.days} d</span><span className="w-20 text-right font-semibold tabular-nums">{money(o.cost)}</span></div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ReadinessItem {
  key: string;
  ok: boolean;
  label: string;
  fixStageId?: string;
}

export function RouteStagesStep({
  steps, setSteps, origin, destination, shipmentType, shipmentComplete, isOversize,
  onContinue, onSaveDraft,
}: {
  steps: RouteStep[];
  setSteps: Dispatch<SetStateAction<RouteStep[]>>;
  origin?: LocationValue;
  destination?: LocationValue;
  shipmentType: ShipmentType;
  shipmentComplete: boolean;
  isOversize: boolean;
  onContinue: () => void;
  onSaveDraft: () => void;
}) {
  const [aiState, setAiState] = useState<Record<string, AiState>>({});
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    // start with already-resolved stages collapsed for a tidy overview
    const s = new Set<string>();
    for (const st of steps) {
      const status = stageStatus(st);
      if (status === "confirmed" || status === "rate-selected") s.add(st.id);
    }
    return s;
  });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [oceanDialogFor, setOceanDialogFor] = useState<string | null>(null);

  const totalCost = useMemo(() => steps.reduce((s, st) => s + (Number(st.cost) || 0), 0), [steps]);
  const totalDays = useMemo(() => steps.reduce((s, st) => s + (Number(st.durationDays) || 0), 0), [steps]);
  const oPoint = useMemo(() => pointFromLocation(origin), [origin]);
  const dPoint = useMemo(() => pointFromLocation(destination), [destination]);

  const aiFor = (id: string) => aiState[id] ?? IDLE_AI;

  const patchStep = (id: string, patch: Partial<RouteStep>) => setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeStep = (id: string) => setSteps((prev) => prev.filter((s) => s.id !== id));
  const addStep = (kind: RouteStepKind) => {
    setSteps((prev) => [...prev, { id: nextId(), ...defaultsFor(kind) }]);
    toast.success(`${kind === "ai_vendor" ? "AI vendor search" : "Route"} stage added`);
  };
  const move = (id: string, dir: -1 | 1) =>
    setSteps((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  const dropOn = (targetId: string) => {
    setSteps((prev) => {
      if (!draggingId || draggingId === targetId) return prev;
      const from = prev.findIndex((s) => s.id === draggingId);
      const to = prev.findIndex((s) => s.id === targetId);
      if (from < 0 || to < 0) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
    setDraggingId(null);
  };

  const pickOcean = (stepId: string, carrierId: string, cost: number, days: number) => {
    patchStep(stepId, {
      carrierId, cost, durationDays: days, status: "quoted", provenance: "api", dataSourceId: "ds-msc-api", edited: false,
      charges: oceanCharges(cost),
      vessel: VESSELS[Math.floor(seeded(carrierId) * VESSELS.length)],
      sailingDate: daysFromNow(10), freeDaysPod: 10,
    });
    setOceanDialogFor(null);
    toast.success(`Ocean stage set — ${CARRIERS.find((c) => c.id === carrierId)?.name}`);
  };

  const toggleCollapse = (id: string) =>
    setCollapsed((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const clearRoute = () => { setSteps([]); setAiState({}); setCollapsed(new Set()); toast.success("Route cleared"); };

  const focusStage = (id: string) => {
    setCollapsed((prev) => { const n = new Set(prev); n.delete(id); return n; });
    setTimeout(() => {
      const el = document.getElementById(`stage-${id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  // ── readiness ──
  const statuses = steps.map((s) => stageStatus(s, aiFor(s.id).phase));
  const priced = steps.filter((s) => (Number(s.cost) || 0) > 0).length;
  const unresolved = steps.filter((s, i) => isBlockingStatus(statuses[i]));
  const missingSource = steps.filter((s) => s.kind !== "custom" && !s.vendorId && !s.carrierId);
  const pendingAi = steps.filter((s) => aiFor(s.id).phase === "suggestions");

  const readiness: ReadinessItem[] = [
    { key: "shipment", ok: shipmentComplete, label: shipmentComplete ? "Shipping details complete" : "Shipping details incomplete" },
    { key: "stages", ok: steps.length > 0, label: steps.length > 0 ? `${steps.length} route stage${steps.length > 1 ? "s" : ""}` : "No route stages added yet" },
    { key: "priced", ok: unresolved.length === 0 && steps.length > 0, label: unresolved.length === 0 ? `${priced} stage${priced === 1 ? "" : "s"} priced` : `${unresolved.length} stage${unresolved.length > 1 ? "s" : ""} need a rate`, fixStageId: unresolved[0]?.id },
    ...(missingSource.length ? [{ key: "vendor", ok: false, label: `${missingSource.length} stage${missingSource.length > 1 ? "s" : ""} missing a vendor or source`, fixStageId: missingSource[0].id }] : []),
    ...(pendingAi.length ? [{ key: "ai", ok: false, label: `${pendingAi.length} AI suggestion${pendingAi.length > 1 ? "s" : ""} waiting for confirmation`, fixStageId: pendingAi[0].id }] : []),
  ];
  // vendor / AI items are advisory nudges; hard blockers are missing shipment details,
  // no stages, and any stage without a valid rate (needs-rate / mid-AI / unconfirmed suggestion).
  const blockers = readiness.filter((r) => !r.ok && (r.key === "shipment" || r.key === "stages" || r.key === "priced" || r.key === "ai"));
  const canContinue = blockers.length === 0;

  const mapMode = shipmentType === "Air" ? "air" : "ocean";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* left: stages */}
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Route stages</h3>
            <p className="text-xs text-muted-foreground">Add each transportation stage, select a vendor and rate source, and confirm its cost and duration.</p>
          </div>
          <AddStepMenu onAdd={addStep} kinds={LEG_KINDS} />
        </div>

        {steps.length === 0 && (
          <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground"><ListOrdered className="size-8 opacity-50" /><p className="text-sm">No stages yet. Add the first stage of the route.</p></CardContent></Card>
        )}

        {steps.map((step, i) => {
          const status = statuses[i];
          const canCollapse = status === "confirmed" || status === "rate-selected";
          const isCollapsed = canCollapse && collapsed.has(step.id);
          return (
            <div
              key={step.id}
              id={`stage-${step.id}`}
              onDragOver={(e) => { if (draggingId && draggingId !== step.id) e.preventDefault(); }}
              onDrop={() => dropOn(step.id)}
            >
              <RouteStageCard
                step={step}
                index={i}
                total={steps.length}
                collapsed={isCollapsed}
                canCollapse={canCollapse}
                onToggleCollapse={() => toggleCollapse(step.id)}
                vendors={vendorOptions(step.kind)}
                onPatch={(p) => patchStep(step.id, p)}
                onRemove={() => removeStep(step.id)}
                onMoveUp={() => move(step.id, -1)}
                onMoveDown={() => move(step.id, 1)}
                onSearchOcean={() => setOceanDialogFor(step.id)}
                ai={aiFor(step.id)}
                onAiChange={(next) => setAiState((prev) => ({ ...prev, [step.id]: next }))}
                dragging={draggingId === step.id}
                dragHandleProps={{
                  draggable: true,
                  onDragStart: () => setDraggingId(step.id),
                  onDragEnd: () => setDraggingId(null),
                }}
              />
            </div>
          );
        })}

        {steps.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:bg-status-negative-bg hover:text-destructive">
                <RotateCcw className="size-4" /> Clear route
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear the entire route?</AlertDialogTitle>
                <AlertDialogDescription>All {steps.length} route stages, with their vendors, rates, and durations, will be removed. This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep route</AlertDialogCancel>
                <AlertDialogAction onClick={clearRoute} className="bg-destructive text-white hover:bg-destructive/90">Clear route</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* right: summary + map + readiness */}
      <div className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total internal cost" value={money(totalCost)} sub="before profit" icon={DollarSign} accent="primary" className="col-span-2" />
          <StatCard label="Estimated duration" value={`${totalDays} d`} sub="door-to-door" icon={Clock} accent="warning" />
          <StatCard label="Route stages" value={steps.length} icon={ListOrdered} accent="success" />
        </div>

        <Card className="overflow-hidden p-0">
          <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Route map</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0">
            <MapPreview origin={oPoint} destination={dPoint} transitDays={totalDays || undefined} mode={mapMode} className="h-52" />
            <p className="mt-2 flex items-center gap-1.5 text-caption text-muted-foreground">
              <Navigation className="size-3.5 shrink-0 text-primary" />
              Origin → final destination shown. Distances use restriction-aware routing.
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="About routing" className="rounded-full outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"><Info className="size-3.5" /></button>
                </TooltipTrigger>
                <TooltipContent className="max-w-64">
                  {isOversize
                    ? "This is an over-dimension load. Truck legs are routed with bridge, height, and weight restrictions accounted for."
                    : "Truck and ocean legs use restriction-aware routing for realistic distances and transit."}
                </TooltipContent>
              </Tooltip>
            </p>
          </CardContent>
        </Card>

        {/* Route readiness */}
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold">Route readiness</div>
            {canContinue ? (
              <StatusBadge tone="positive" dot={false}>Ready for pricing</StatusBadge>
            ) : (
              <StatusBadge tone="warning" dot={false}>{blockers.length} item{blockers.length > 1 ? "s" : ""} to resolve</StatusBadge>
            )}
          </div>
          <ul className="space-y-1.5 text-sm">
            {readiness.map((r) => {
              const Icon = r.ok ? CheckCircle2 : AlertTriangle;
              const clickable = !r.ok && r.fixStageId;
              const content = (
                <span className="flex items-center gap-2">
                  <Icon className={cn("size-4 shrink-0", r.ok ? "text-success" : "text-status-warning-fg")} />
                  <span className={cn(r.ok ? "text-muted-foreground" : "font-medium")}>{r.label}</span>
                </span>
              );
              return (
                <li key={r.key}>
                  {clickable ? (
                    <button type="button" onClick={() => focusStage(r.fixStageId!)} className="rounded text-left outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50">
                      {content}
                    </button>
                  ) : content}
                </li>
              );
            })}
          </ul>
          <Separator className="my-3" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total internal cost</span>
            <span className="font-semibold tabular-nums">{money(totalCost)}</span>
          </div>
          {!canContinue && (
            <p className="mt-3 text-caption text-muted-foreground">
              Resolve the highlighted items to price and send a client quote. You can still save a draft.
            </p>
          )}
        </Card>
      </div>

      </div>

      {/* The shared bar — same place, same shape, as every other step.
          A sibling of the grid, so sticky has the page to travel in. */}
      <ActionBar>
        <Button variant="outline" onClick={onSaveDraft}><Save className="size-4" /> Save draft</Button>
        <Button onClick={onContinue} disabled={!canContinue} className="sm:min-w-48">
          Continue to pricing <ArrowRight className="size-4" />
        </Button>
      </ActionBar>

      <OceanSearchDialog open={oceanDialogFor != null} onOpenChange={(o) => !o && setOceanDialogFor(null)} onPick={(c, cost, d) => oceanDialogFor && pickOcean(oceanDialogFor, c, cost, d)} />
    </div>
  );
}
