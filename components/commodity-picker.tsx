"use client";

import { useMemo } from "react";
import { Sparkles, Ruler } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CommodityKind, ContainerCode, Dimensions, ShipmentType } from "@/lib/types";
import {
  EQUIPMENT, EQUIPMENT_INDUSTRIES, equipmentCategories, equipmentMakes, equipmentModels, getEquipment,
} from "@/lib/data/equipment";
import { CONTAINER_LABEL } from "@/lib/data/containers";

export interface CommoditySelection {
  kind: CommodityKind;
  label: string;
  equipmentId?: string;
  industry?: string;
  category?: string;
  make?: string;
  dimensions?: Dimensions;
  container?: ContainerCode;
  shipmentType: ShipmentType;
  /** for self-propelled units — inoperable removes RoRo as an option */
  condition?: "operable" | "inoperable";
}

// Commodity = WHAT it is (mode is derived from operability + dimensions, not chosen here).
const KINDS: { value: CommodityKind; label: string }[] = [
  { value: "equipment", label: "Machinery & Equipment" },
  { value: "vehicle", label: "Vehicles" },
  { value: "boat", label: "Boats & Yachts" },
  { value: "livestock", label: "Livestock" },
  { value: "oog", label: "Project / OOG" },
  { value: "bulk", label: "Bulk" },
  { value: "parcel", label: "General / Parcel" },
];

// Kinds that can be self-propelled → get an optional operable/non-operable + loading-method dropdown.
const SELF_PROPELLED: CommodityKind[] = ["equipment", "vehicle", "boat"];

const SHIPMENT_TYPES: ShipmentType[] = ["Container", "Flatrack", "RoRo", "Breakbulk", "Reefer", "LCL", "Air"];

// Reasonable default shipment mode per commodity kind.
function defaultShipmentForKind(kind: CommodityKind): ShipmentType {
  switch (kind) {
    case "vehicle":
    case "boat":
      return "RoRo";
    case "livestock":
      return "Reefer";
    case "oog":
      return "Breakbulk";
    case "bulk":
      return "Breakbulk";
    case "parcel":
      return "LCL";
    default:
      return "Container";
  }
}

function shipmentFor(container?: ContainerCode): ShipmentType {
  if (container === "RORO") return "RoRo";
  if (container === "40FR" || container === "20FR") return "Flatrack";
  if (container === "20RF" || container === "40RF") return "Reefer";
  return "Container";
}

// Which shipment modes still need a container size picker.
const NEEDS_CONTAINER: ShipmentType[] = ["Container", "Flatrack", "Reefer"];

export function CommodityPicker({
  value,
  onChange,
}: {
  value: CommoditySelection;
  onChange: (v: CommoditySelection) => void;
}) {
  const eq = getEquipment(value.equipmentId);
  const industries = EQUIPMENT_INDUSTRIES;
  const categories = useMemo(() => (value.industry ? equipmentCategories(value.industry) : []), [value.industry]);
  const makes = useMemo(
    () => (value.industry && value.category ? equipmentMakes(value.industry, value.category) : []),
    [value.industry, value.category],
  );
  const models = useMemo(
    () => (value.industry && value.category && value.make ? equipmentModels(value.industry, value.category, value.make) : []),
    [value.industry, value.category, value.make],
  );

  const setKind = (kind: CommodityKind) =>
    onChange({ kind, label: "", shipmentType: defaultShipmentForKind(kind), condition: SELF_PROPELLED.includes(kind) ? "operable" : undefined });

  const pickModel = (id: string) => {
    const m = getEquipment(id);
    if (!m) return;
    let st = shipmentFor(m.container);
    if (value.condition === "inoperable" && st === "RoRo") st = "Flatrack"; // non-operable can't RoRo
    onChange({
      ...value,
      equipmentId: id,
      label: `${m.make} ${m.model}`,
      dimensions: m.dimensions,
      container: st === "RoRo" ? undefined : m.container,
      shipmentType: st,
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1.5 block">Type of Commodity</Label>
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => setKind(k.value)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm transition",
                value.kind === k.value ? "border-primary bg-primary/5 font-medium text-primary" : "hover:bg-muted",
              )}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      {value.kind === "equipment" ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Industry">
              <Select value={value.industry} onValueChange={(v) => onChange({ ...value, industry: v, category: undefined, make: undefined, equipmentId: undefined })}>
                <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>{industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Category">
              <Select value={value.category} disabled={!value.industry} onValueChange={(v) => onChange({ ...value, category: v, make: undefined, equipmentId: undefined })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Manufacturer">
              <Select value={value.make} disabled={!value.category} onValueChange={(v) => onChange({ ...value, make: v, equipmentId: undefined })}>
                <SelectTrigger><SelectValue placeholder="Select make" /></SelectTrigger>
                <SelectContent>{makes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Model">
              <Select value={value.equipmentId} disabled={!value.make} onValueChange={pickModel}>
                <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                <SelectContent>{models.map((m) => <SelectItem key={m.id} value={m.id}>{m.model}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>

          {eq && (
            <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-3 text-sm">
              <div className="mb-1.5 flex items-center gap-1.5 font-medium text-primary">
                <Sparkles className="size-4" /> Auto-filled from equipment database
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground sm:grid-cols-4">
                <Spec k="Dimensions" v={`${eq.dimensions.lengthIn}″L × ${eq.dimensions.widthIn}″W × ${eq.dimensions.heightIn}″H`} />
                <Spec k="Weight" v={`${eq.dimensions.weightLb.toLocaleString()} lb`} />
                <Spec k="Container" v={CONTAINER_LABEL[eq.container]} />
                <Spec k="Shipment" v={shipmentFor(eq.container)} />
              </div>
              {eq.loadingNotes && <p className="mt-1.5 text-xs text-muted-foreground">⚑ {eq.loadingNotes}</p>}
            </div>
          )}

          <ShippingOptions value={value} onChange={onChange} />
        </div>
      ) : (
        <div className="space-y-3">
          <Field label="Description">
            <Input value={value.label} placeholder="e.g. Steel coils, yacht, machinery"
              onChange={(e) => onChange({ ...value, label: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Dim label="Length (in)" v={value.dimensions?.lengthIn} onChange={(n) => onChange({ ...value, dimensions: { ...(value.dimensions ?? blankDims()), lengthIn: n } })} />
            <Dim label="Width (in)" v={value.dimensions?.widthIn} onChange={(n) => onChange({ ...value, dimensions: { ...(value.dimensions ?? blankDims()), widthIn: n } })} />
            <Dim label="Height (in)" v={value.dimensions?.heightIn} onChange={(n) => onChange({ ...value, dimensions: { ...(value.dimensions ?? blankDims()), heightIn: n } })} />
            <Dim label="Weight (lb)" v={value.dimensions?.weightLb} onChange={(n) => onChange({ ...value, dimensions: { ...(value.dimensions ?? blankDims()), weightLb: n } })} />
          </div>
          <ShippingOptions value={value} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

// Optional shipping dropdowns shown during model/data entry — condition, loading method / shipment type,
// and container are all optional and default to sensible auto values.
function ShippingOptions({ value, onChange }: { value: CommoditySelection; onChange: (v: CommoditySelection) => void }) {
  const selfProp = SELF_PROPELLED.includes(value.kind);
  const modeOptions: ShipmentType[] = selfProp ? ["RoRo", "Container", "Flatrack"] : SHIPMENT_TYPES;
  const modeLabel = (s: ShipmentType) =>
    s === "Container" ? (selfProp ? "Dry (container)" : "Container") : s === "Flatrack" ? "Flat Rack" : s;

  const setCondition = (c: "operable" | "inoperable") => {
    const next: CommoditySelection = { ...value, condition: c };
    if (c === "inoperable" && next.shipmentType === "RoRo") next.shipmentType = "Container"; // non-operable can't RoRo
    onChange(next);
  };
  const setMode = (m: ShipmentType) =>
    onChange({ ...value, shipmentType: m, container: NEEDS_CONTAINER.includes(m) ? (value.container ?? (m === "Flatrack" ? "40FR" : "40HC")) : undefined });

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {selfProp && (
        <Field label="Unit condition (optional)">
          <Select value={value.condition ?? "operable"} onValueChange={(c) => setCondition(c as "operable" | "inoperable")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="operable">Operable (self-propelled)</SelectItem>
              <SelectItem value="inoperable">Non-operable</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      )}
      <Field label={selfProp ? "Loading method (optional)" : "Shipment type (optional)"}>
        <Select value={value.shipmentType} onValueChange={(m) => setMode(m as ShipmentType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {modeOptions.map((s) => (
              <SelectItem key={s} value={s} disabled={selfProp && s === "RoRo" && value.condition === "inoperable"}>
                {modeLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {NEEDS_CONTAINER.includes(value.shipmentType) && (
        <Field label="Container (optional)">
          <Select value={value.container ?? "40HC"} onValueChange={(c) => onChange({ ...value, container: c as ContainerCode })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(CONTAINER_LABEL) as ContainerCode[]).filter((c) => c !== "RORO").map((c) => (
                <SelectItem key={c} value={c}>{CONTAINER_LABEL[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
    </div>
  );
}

function blankDims(): Dimensions {
  return { lengthIn: 0, widthIn: 0, heightIn: 0, weightLb: 0 };
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
function Spec({ k, v }: { k: string; v: string }) {
  return <div><span className="block text-caption uppercase tracking-wide">{k}</span><span className="font-medium text-foreground">{v}</span></div>;
}
function Dim({ label, v, onChange }: { label: string; v?: number; onChange: (n: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type="number" value={v || ""} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export function defaultCommodity(): CommoditySelection {
  return { kind: "equipment", label: "", shipmentType: "Container" };
}

export { EQUIPMENT };
