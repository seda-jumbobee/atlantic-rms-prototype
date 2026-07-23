"use client";

import { useMemo, useState } from "react";
import {
  ArrowUp, ArrowDown, Trash2, Ship, Sparkles, Loader2, Wand2, Clock, DollarSign,
  ListOrdered, CheckCircle2, RotateCcw, AlertTriangle, Package, Truck, TrainFront,
  Wrench, Droplets, PackageOpen, Container, MapPin, Anchor, type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import type { RouteStep, RouteStepKind, QuoteLeg, LegKind, VendorServiceKind, ChargeLine } from "@/lib/types";
import { money, seeded, VESSELS, daysFromNow, fmtDate } from "@/lib/format";
import { chargeTotal } from "@/lib/quote-engine";
import { cn } from "@/lib/utils";
import { ChargeTable } from "@/components/quote/charge-table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Layers, Navigation, TriangleAlert } from "lucide-react";
import { CARRIERS, getVendor, VENDORS, vendorsForService, DATA_SOURCES, getPort, getAddress } from "@/lib/data";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { CarrierLogo } from "@/components/carrier-logo";
import { MapPreview, type MapPoint } from "@/components/map-preview";
import { LocationCombobox, type LocationValue } from "@/components/location-combobox";
import { CommodityPicker, type CommoditySelection, defaultCommodity } from "@/components/commodity-picker";
import { QuoteOutput, type OutputPayload } from "@/components/quote/quote-output";
import { computePricing, clientLines } from "@/lib/pricing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddStepMenu, getStepMeta } from "@/components/route/add-step-menu";

const ICONS: Record<string, LucideIcon> = {
  Package, Truck, TrainFront, Wrench, Droplets, PackageOpen, Container, Ship, MapPin, Anchor, Sparkles,
};
const iconFor = (name: string): LucideIcon => ICONS[name] ?? Anchor;

let seq = 0;
const nextId = () => `step-${++seq}-${Math.floor(seeded(String(seq)) * 1e6)}`;

let chSeq = 0;
// Break an ocean total into a realistic base + surcharge breakdown.
function oceanCharges(total: number): ChargeLine[] {
  const thc = 250, eca = 15, odf = 55;
  const baf = Math.round(total * 0.08);
  const bas = Math.max(0, total - baf - thc - eca - odf);
  const mk = (code: string, name: string, basis: ChargeLine["basis"], unitCost: number): ChargeLine =>
    ({ id: `rch-${++chSeq}`, code, name, basis, qty: 1, currency: "USD", unitCost });
  return [
    mk("BAS", "Basic Ocean Freight", "Container", bas),
    mk("BAF", "Bunker Adjustment Factor", "Container", baf),
    mk("THC", "Terminal Handling Charge", "Container", thc),
    mk("ECA", "Emission Control Areas", "Container", eca),
    mk("ODF", "Documentation Fee — Origin", "Bill of Lading", odf),
  ];
}
const sumCharges = (charges?: ChargeLine[]) => (charges ?? []).reduce((s, c) => s + chargeTotal(c), 0);

// route leg kinds (commodity is the base step, handled separately)
const LEG_KINDS: RouteStepKind[] = [
  "trucking", "rail", "disassembly", "washing", "loading", "cfs_packing", "drayage", "ocean", "oncarriage", "custom", "ai_vendor",
];

const LEG_SERVICE: Partial<Record<RouteStepKind, VendorServiceKind>> = {
  trucking: "trucking", rail: "rail", loading: "loading", disassembly: "disassembly",
  washing: "washing", cfs_packing: "packing", drayage: "drayage", oncarriage: "trucking", ai_vendor: "trucking",
};
const LEG_TO_QUOTE: Record<RouteStepKind, LegKind> = {
  commodity: "preparation", trucking: "inland", rail: "inland", disassembly: "loading", washing: "loading",
  loading: "loading", cfs_packing: "cfs", drayage: "drayage", ocean: "ocean", oncarriage: "oncarriage",
  custom: "preparation", ai_vendor: "oncarriage",
};

function vendorOptions(kind: RouteStepKind) {
  const svc = LEG_SERVICE[kind];
  const list = svc ? vendorsForService(svc) : [];
  return list.length ? list : VENDORS;
}

function defaultsFor(kind: RouteStepKind): Omit<RouteStep, "id"> {
  const meta = getStepMeta(kind);
  const base = { kind, title: meta.label, detail: meta.description, icon: meta.iconName, status: "set" as const };
  switch (kind) {
    case "trucking": return { ...base, title: "Inland Trucking", detail: "Origin → CFS", location: "Origin", toLocation: "CFS", cost: 1850, durationDays: 2 };
    case "rail": return { ...base, title: "Rail Pre-carriage", detail: "Origin → ramp", location: "Origin", toLocation: "Rail ramp", cost: 1400, durationDays: 4 };
    case "disassembly": return { ...base, title: "Disassembly", detail: "Strip for shipment", location: "CFS", cost: 900, durationDays: 1 };
    case "washing": return { ...base, title: "Washing & Steam Clean", detail: "Biosecurity prep", location: "CFS", cost: 350, durationDays: 1 };
    case "loading": return { ...base, title: "Loading & Lashing", detail: "Crane load & secure", location: "CFS", cost: 2500, durationDays: 1 };
    case "cfs_packing": return { ...base, title: "CFS Packing (40FR)", detail: "Container stuffing", location: "CFS", cost: 1200, durationDays: 1 };
    case "drayage": return { ...base, title: "Drayage", detail: "CFS → port", location: "CFS", toLocation: "Port", cost: 650, durationDays: 1 };
    case "ocean": return { ...base, title: "Ocean Freight", detail: "Main sea leg", location: "Load port", toLocation: "Discharge port", cost: 0, durationDays: 0 };
    case "oncarriage": return { ...base, title: "On-carriage", detail: "Port → consignee", location: "Discharge port", toLocation: "Destination", cost: 1100, durationDays: 3 };
    case "ai_vendor": return { ...base, title: "AI Vendor Search", detail: "Find a regional carrier", location: "From", toLocation: "To", cost: 0, durationDays: 0, status: "pending_ai" };
    case "custom": default: return { ...base, title: "Custom step", detail: "Free-form leg", location: "", cost: 500, durationDays: 1 };
  }
}

const OCEAN_OFFERS = [
  { carrierId: "c-maersk", cost: 4380, days: 26 }, { carrierId: "c-msc", cost: 3950, days: 31 },
  { carrierId: "c-hapag", cost: 4620, days: 24 }, { carrierId: "c-cma", cost: 4120, days: 28 },
  { carrierId: "c-one", cost: 3880, days: 30 }, { carrierId: "c-cosco", cost: 3990, days: 33 },
];

function exampleLegs(): RouteStep[] {
  return [
    { id: nextId(), kind: "trucking", icon: "Truck", status: "set", title: "Inland Trucking", detail: "RGN flatbed, 1,080 mi", location: "Charleston, IL", toLocation: "Houston CFS", vendorId: "v-rgntrans", dataSourceId: "ds-custom-jrl", cost: 3240, durationDays: 3 },
    { id: nextId(), kind: "disassembly", icon: "Wrench", status: "set", title: "Disassembly & Wash", detail: "Header off, steam clean", location: "Houston CFS", vendorId: "v-morris", cost: 1250, durationDays: 1 },
    { id: nextId(), kind: "cfs_packing", icon: "Container", status: "set", title: "CFS Packing — 40FR", detail: "Stuff & lash on 40' flat rack", location: "Houston CFS", vendorId: "v-morris", cost: 2500, durationDays: 1 },
    { id: nextId(), kind: "ocean", icon: "Ship", status: "quoted", title: "Ocean Freight", detail: "40FR all-in incl. surcharges", location: "Houston, US", toLocation: "Poti, GE", carrierId: "c-msc", dataSourceId: "ds-msc-api", cost: 6850, durationDays: 34, charges: oceanCharges(6850), vessel: "MSC Allegra / 118E", sailingDate: daysFromNow(9), freeDaysPod: 10 },
    { id: nextId(), kind: "ai_vendor", icon: "Sparkles", status: "pending_ai", title: "On-carriage (Poti → Baku)", detail: "Regional truck — needs AI sourcing", location: "Poti, GE", toLocation: "Baku, AZ", cost: 0, durationDays: 0 },
  ];
}

function pointFromLocation(v?: LocationValue): MapPoint | undefined {
  if (!v) return undefined;
  if (v.kind === "port") { const p = getPort(v.id); return p ? { lat: p.lat, lng: p.lng, label: p.name } : undefined; }
  const a = getAddress(v.id); return a ? { lat: a.lat, lng: a.lng, label: a.city } : undefined;
}

function StatusChip({ status }: { status: RouteStep["status"] }) {
  if (status === "quoted") return <StatusBadge tone="positive">Quoted</StatusBadge>;
  if (status === "pending_ai") return <StatusBadge tone="warning">Pending AI</StatusBadge>;
  return <StatusBadge tone="neutral">Set</StatusBadge>;
}

export function RouteBuilder() {
  const [commodity, setCommodity] = useState<CommoditySelection>(() => ({
    kind: "equipment", label: "John Deere S780 Combine", equipmentId: "e-jd-s770",
    industry: "Farm", category: "Harvesters", make: "John Deere",
    dimensions: { lengthIn: 372, widthIn: 152, heightIn: 158, weightLb: 38500 },
    container: "40FR", shipmentType: "Flatrack",
  }));
  const [origin, setOrigin] = useState<LocationValue | undefined>({ kind: "address", id: "a-charleston", label: "Charleston, IL 61920" });
  const [destination, setDestination] = useState<LocationValue | undefined>({ kind: "address", id: "a-baku", label: "Baku, Azerbaijan" });
  const [legs, setLegs] = useState<RouteStep[]>(exampleLegs);
  const [oceanDialogFor, setOceanDialogFor] = useState<string | null>(null);
  const [routingProvider, setRoutingProvider] = useState<"google" | "here" | "trimble">("here");
  const isOversize = ["Flatrack", "Breakbulk", "RoRo"].includes(commodity.shipmentType) || commodity.kind === "oog";

  const totalPrice = useMemo(() => legs.reduce((s, st) => s + (Number(st.cost) || 0), 0), [legs]);
  const totalDays = useMemo(() => legs.reduce((s, st) => s + (Number(st.durationDays) || 0), 0), [legs]);
  const oPoint = useMemo(() => pointFromLocation(origin), [origin]);
  const dPoint = useMemo(() => pointFromLocation(destination), [destination]);

  // ── logic validation ─────────────────────────────────────────────────────────
  const warnings = useMemo(() => {
    const w: string[] = [];
    if (!commodity.label && !commodity.equipmentId) w.push("Commodity is required — set the base step first.");
    if (!origin || !destination) w.push("Set both origin and destination.");
    const seaModes = ["Container", "Flatrack", "RoRo", "Breakbulk", "Reefer", "LCL"];
    if (seaModes.includes(commodity.shipmentType) && !legs.some((l) => l.kind === "ocean")) w.push("No ocean leg — add the main sea freight.");
    if (commodity.shipmentType !== "RoRo" && commodity.shipmentType !== "Breakbulk" && legs.some((l) => l.kind === "ocean") && !legs.some((l) => l.kind === "drayage" || l.kind === "cfs_packing" || l.kind === "loading"))
      w.push("Containerized cargo usually needs loading/CFS before the ocean leg.");
    const zero = legs.filter((l) => l.kind !== "ai_vendor" && (!l.cost || l.cost === 0)).length;
    if (zero) w.push(`${zero} leg${zero > 1 ? "s" : ""} missing a price.`);
    const pending = legs.filter((l) => l.status === "pending_ai").length;
    if (pending) w.push(`${pending} leg${pending > 1 ? "s" : ""} awaiting AI vendor sourcing.`);
    return w;
  }, [commodity, origin, destination, legs]);

  const commoditySet = !!(commodity.label || commodity.equipmentId);
  const canQuote = commoditySet && !!origin && !!destination && legs.length > 0;

  function addStep(kind: RouteStepKind) {
    setLegs((prev) => [...prev, { id: nextId(), ...defaultsFor(kind) }]);
    toast.success(`${getStepMeta(kind).label} step added`);
  }
  const patchStep = (id: string, patch: Partial<RouteStep>) => setLegs((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeStep = (id: string) => setLegs((prev) => prev.filter((s) => s.id !== id));
  function move(id: string, dir: -1 | 1) {
    setLegs((prev) => {
      const i = prev.findIndex((s) => s.id === id); const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev]; [copy[i], copy[j]] = [copy[j], copy[i]]; return copy;
    });
  }
  function pickOcean(stepId: string, carrierId: string, cost: number, days: number) {
    patchStep(stepId, {
      carrierId, cost, durationDays: days, status: "quoted", dataSourceId: "ds-msc-api",
      charges: oceanCharges(cost),
      vessel: VESSELS[Math.floor(seeded(carrierId) * VESSELS.length)],
      sailingDate: daysFromNow(10), freeDaysPod: 10,
    });
    setOceanDialogFor(null);
    toast.success(`Ocean leg set — ${CARRIERS.find((c) => c.id === carrierId)?.name}`);
  }
  function loadExample() {
    setCommodity({ kind: "equipment", label: "John Deere S780 Combine", equipmentId: "e-jd-s770", industry: "Farm", category: "Harvesters", make: "John Deere", dimensions: { lengthIn: 372, widthIn: 152, heightIn: 158, weightLb: 38500 }, container: "40FR", shipmentType: "Flatrack" });
    setOrigin({ kind: "address", id: "a-charleston", label: "Charleston, IL 61920" });
    setDestination({ kind: "address", id: "a-baku", label: "Baku, Azerbaijan" });
    setLegs(exampleLegs());
    toast.success("Loaded example: combine US → Baku");
  }

  // ── route → quote payload ──────────────────────────────────────────────────────
  const oceanLeg = legs.find((l) => l.kind === "ocean");
  const quoteId = `Q-${190700 + Math.floor(seeded(commodity.label + (origin?.id ?? "") + (destination?.id ?? "")) * 200)}`;
  const quoteLegs = legs.map((s): QuoteLeg => ({
    id: s.id, kind: LEG_TO_QUOTE[s.kind], title: s.title, from: s.location ?? "", to: s.toLocation ?? s.location ?? "",
    vendorId: s.vendorId, carrierId: s.carrierId, dataSourceId: s.dataSourceId, included: true,
    charges: [{ id: `c-${s.id}`, name: s.title, basis: "Flat", qty: 1, currency: "USD", unitCost: Number(s.cost) || 0 }],
  }));
  // client price = 12% markup on the built cost (unchanged behavior), via the shared pricing model
  const routeCalc = computePricing({ legs: quoteLegs, mode: "whole", wholeMethod: "markup", wholeValue: 12, serviceMethod: {}, serviceValue: {} });
  const payload: OutputPayload = {
    quoteId,
    ref: {
      origin: origin?.label ?? "Origin", destination: destination?.label ?? "Destination",
      commodityLabel: commodity.label || commodity.kind, commodityKind: commodity.kind,
      shipmentType: commodity.shipmentType, container: commodity.container,
    },
    clientTotal: routeCalc.clientPrice, lines: clientLines(routeCalc),
    currency: "USD", validTo: "2026-09-30", transitDays: totalDays, carrierId: oceanLeg?.carrierId,
    showCarrier: true, allInOnly: false,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Custom Route" description="Build and price transportation stages manually using selected vendors and contracts.">
        <Button variant="outline" onClick={loadExample}><Wand2 className="size-4" /> Load example: US → Baku</Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* left: base commodity + legs */}
        <div className="space-y-3">
          {/* BASE STEP — commodity (mandatory) */}
          <Card className="border-primary/30 bg-primary/[0.03]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">0</span>
                Commodity — base step <Badge variant="secondary">required</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CommodityPicker value={commodity} onChange={setCommodity} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Origin (pickup)</Label><LocationCombobox value={origin} onChange={setOrigin} placeholder="Port or address…" /></div>
                <div className="space-y-1.5"><Label>Final destination</Label><LocationCombobox value={destination} onChange={setDestination} placeholder="Port or address…" /></div>
              </div>
            </CardContent>
          </Card>

          {/* the route */}
          <div className="flex items-center justify-between pt-1">
            <h3 className="text-sm font-medium text-muted-foreground">Route for this commodity ({legs.length} legs)</h3>
            <AddStepMenu onAdd={addStep} kinds={LEG_KINDS} />
          </div>

          {legs.length === 0 && (
            <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground"><ListOrdered className="size-8 opacity-50" /><p className="text-sm">No legs yet. Add the first leg of the route.</p></CardContent></Card>
          )}

          {legs.map((step, i) => (
            <StepCard key={step.id} step={step} index={i} isFirst={i === 0} isLast={i === legs.length - 1}
              onPatch={(p) => patchStep(step.id, p)} onRemove={() => removeStep(step.id)}
              onMoveUp={() => move(step.id, -1)} onMoveDown={() => move(step.id, 1)} onSearchOcean={() => setOceanDialogFor(step.id)} />
          ))}

          {legs.length > 0 && (
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setLegs([])}><RotateCcw className="size-4" /> Clear legs</Button>
          )}
        </div>

        {/* right: summary + map + quote */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total price" value={money(totalPrice)} icon={DollarSign} accent="primary" className="col-span-2" />
            <StatCard label="Duration" value={`${totalDays} d`} sub="door-to-door" icon={Clock} accent="warning" />
            <StatCard label="Legs" value={legs.length} icon={ListOrdered} accent="success" />
          </div>

          <Card className="overflow-hidden p-0">
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Route map</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              <MapPreview origin={oPoint} destination={dPoint} transitDays={totalDays || undefined} mode={commodity.shipmentType === "Air" ? "air" : "ocean"} className="h-56" />
            </CardContent>
          </Card>

          {/* Routing provider — truck/oversize-aware routing (research: HERE/Trimble; Google = basemap only) */}
          <Card className="space-y-2 p-4">
            <div className="flex items-center gap-1.5 text-sm font-medium"><Navigation className="size-4 text-primary" /> Routing provider</div>
            <Select value={routingProvider} onValueChange={(v) => setRoutingProvider(v as "google" | "here" | "trimble")}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="google">Google Maps — geocode &amp; basemap (car only)</SelectItem>
                <SelectItem value="here">HERE Routing v8 — truck / oversize</SelectItem>
                <SelectItem value="trimble">Trimble PC*MILER — US oversize (production)</SelectItem>
              </SelectContent>
            </Select>
            {isOversize && routingProvider === "google" && (
              <div className="flex items-start gap-1.5 rounded-md border border-status-warning-fg/30 bg-status-warning-bg p-2 text-caption text-status-warning-fg">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                Over-dimension load — Google Maps ignores height/weight/width & bridge limits. Use HERE or Trimble for restriction-aware truck routing (auto-detours).
              </div>
            )}
            <p className="text-caption text-muted-foreground">Trucker Path is a driver app + load board (no routing API). Oversize routing uses HERE/Trimble; Google is kept for geocoding &amp; basemap tiles.</p>
          </Card>

          {warnings.length > 0 && (
            <Card className="border-status-warning-fg/30 bg-status-warning-bg p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-status-warning-fg"><AlertTriangle className="size-4" /> Route check</div>
              <ul className="space-y-1 text-xs text-status-warning-fg/90">{warnings.map((w, i) => <li key={i}>• {w}</li>)}</ul>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Generate quote from route</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Quoted legs</span><span className="tabular-nums">{legs.filter((s) => s.status === "quoted").length}/{legs.length}</span></div>
              <div className="flex items-center justify-between font-medium"><span>All-in route cost</span><span className="tabular-nums">{money(totalPrice)}</span></div>
              <Separator />
              {canQuote ? (
                <QuoteOutput payload={payload} />
              ) : (
                <p className="text-xs text-muted-foreground">Set commodity, origin, destination and at least one leg to generate a quote ({quoteId}).</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <OceanSearchDialog open={oceanDialogFor != null} onOpenChange={(o) => !o && setOceanDialogFor(null)} onPick={(c, cost, d) => oceanDialogFor && pickOcean(oceanDialogFor, c, cost, d)} />
    </div>
  );
}

function StepCard({ step, index, isFirst, isLast, onPatch, onRemove, onMoveUp, onMoveDown, onSearchOcean }: {
  step: RouteStep; index: number; isFirst: boolean; isLast: boolean;
  onPatch: (patch: Partial<RouteStep>) => void; onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void; onSearchOcean: () => void;
}) {
  const Icon = iconFor(step.icon);
  const vendors = vendorOptions(step.kind);
  const hasCharges = !!step.charges?.length;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-2 pt-0.5">
          <span className="grid size-6 place-items-center rounded-full bg-muted text-xs font-semibold tabular-nums text-muted-foreground">{index + 1}</span>
          <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></div>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2"><p className="truncate font-medium">{step.title}</p><StatusChip status={step.status} /></div>
              <p className="mt-0.5 text-xs text-muted-foreground">{step.location}{step.toLocation ? <span className="mx-1 text-foreground/40">→</span> : null}{step.toLocation}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {step.carrierId && <CarrierLogo carrierId={step.carrierId} size="sm" />}
              <Button variant="ghost" size="icon" className="size-7" disabled={isFirst} onClick={onMoveUp}><ArrowUp className="size-4" /></Button>
              <Button variant="ghost" size="icon" className="size-7" disabled={isLast} onClick={onMoveDown}><ArrowDown className="size-4" /></Button>
              <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={onRemove}><Trash2 className="size-4" /></Button>
            </div>
          </div>

          {/* details: name (custom), vendor/carrier, source, detail */}
          <div className="grid gap-2 sm:grid-cols-2">
            {step.kind === "custom" && (
              <div className="space-y-1 sm:col-span-2"><Label className="text-xs text-muted-foreground">Step name</Label><Input value={step.title} onChange={(e) => onPatch({ title: e.target.value })} className="h-8" /></div>
            )}
            {step.kind === "ocean" ? (
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Carrier</Label>
                <Select value={step.carrierId} onValueChange={(v) => onPatch({ carrierId: v })}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="Select carrier" /></SelectTrigger>
                  <SelectContent>{CARRIERS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Vendor</Label>
                <Select value={step.vendorId} onValueChange={(v) => onPatch({ vendorId: v })}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>{vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name} · T{v.tier}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Rate source</Label>
              <Select value={step.dataSourceId} onValueChange={(v) => onPatch({ dataSourceId: v })}>
                <SelectTrigger className="h-8"><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>{DATA_SOURCES.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            {hasCharges ? (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cost (from breakdown)</Label>
                <div className="flex h-8 w-32 items-center rounded-md border bg-muted/40 px-2 text-sm font-medium tabular-nums">{money(step.cost)}</div>
              </div>
            ) : (
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Cost (USD)</Label><Input type="number" min={0} value={step.cost} onChange={(e) => onPatch({ cost: Number(e.target.value) })} className="h-8 w-32 tabular-nums" /></div>
            )}
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Duration (days)</Label><Input type="number" min={0} value={step.durationDays} onChange={(e) => onPatch({ durationDays: Number(e.target.value) })} className="h-8 w-28 tabular-nums" /></div>
            {step.kind === "ocean" && <Button variant="outline" size="sm" onClick={onSearchOcean}><Ship className="size-4" /> Search shipping lines</Button>}
            {step.kind === "ai_vendor" && <AiVendorAction step={step} onPatch={onPatch} />}
          </div>

          {hasCharges && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <button className="group flex w-full items-center gap-1.5 rounded-md border bg-muted/30 px-2.5 py-1.5 text-left text-xs font-medium text-muted-foreground hover:bg-muted">
                  <Layers className="size-3.5 text-primary" /> Surcharges &amp; details ({step.charges!.length} lines)
                  {(step.vessel || step.sailingDate) && (
                    <span className="ml-1 truncate font-normal">· {step.vessel}{step.sailingDate ? ` · sailing ${fmtDate(step.sailingDate)}` : ""}{step.freeDaysPod != null ? ` · ${step.freeDaysPod} free days POD` : ""}</span>
                  )}
                  <ChevronDown className="ml-auto size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <ChargeTable charges={step.charges!} onChange={(charges) => onPatch({ charges, cost: sumCharges(charges) })} />
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </Card>
  );
}

function AiVendorAction({ step, onPatch }: { step: RouteStep; onPatch: (p: Partial<RouteStep>) => void }) {
  const [loading, setLoading] = useState(false);
  function findCarriers() {
    setLoading(true);
    setTimeout(() => {
      const vendor = getVendor("v-caspian");
      onPatch({ vendorId: "v-caspian", cost: 2150, durationDays: 4, status: "quoted", dataSourceId: "ds-custom-caspian", detail: vendor ? `Sourced via ${vendor.name}` : "AI-sourced carrier" });
      setLoading(false);
      toast.success("AI sourced vendor", { description: "Caspian Forwarding (Poti) · confirmed $2,150" });
    }, 1400);
  }
  if (step.status === "quoted" && step.vendorId === "v-caspian")
    return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success"><CheckCircle2 className="size-4" /> AI sourced — {getVendor("v-caspian")?.name}</span>;
  return <Button variant="outline" size="sm" onClick={findCarriers} disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{loading ? "Searching carriers…" : "Find carriers with AI"}</Button>;
}

function OceanSearchDialog({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; onPick: (carrierId: string, cost: number, days: number) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Search shipping lines</DialogTitle><DialogDescription>Demo ocean rates for this leg. Pick a carrier to set cost & transit.</DialogDescription></DialogHeader>
        <div className="space-y-2">
          {[...OCEAN_OFFERS].sort((a, b) => a.cost - b.cost).map((o, i) => (
            <button key={o.carrierId} onClick={() => onPick(o.carrierId, o.cost, o.days)} className={cn("flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60", i === 0 && "border-primary/40 bg-primary/5")}>
              <div className="flex items-center gap-3"><CarrierLogo carrierId={o.carrierId} size="md" showName />{i === 0 && <StatusBadge tone="positive" dot={false}>Cheapest</StatusBadge>}</div>
              <div className="flex items-center gap-4 text-sm"><span className="flex items-center gap-1 text-muted-foreground"><Clock className="size-3.5" /> {o.days} d</span><span className="w-20 text-right font-semibold tabular-nums">{money(o.cost)}</span></div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
