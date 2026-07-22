"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
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

/** Required-field asterisk — sidebar-primary in normal state per the DS rule. */
export function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className="ml-0.5 text-sidebar-primary">*</span>
      <span className="sr-only"> (required)</span>
    </>
  );
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

export const COMMODITY_KIND_LABEL: Record<CommodityKind, string> = Object.fromEntries(
  KINDS.map((k) => [k.value, k.label]),
) as Record<CommodityKind, string>;

// Kinds that can be self-propelled → get an operable/non-operable + loading-method dropdown.
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
  errors,
  sectionHeadings = false,
}: {
  /** Omit to start with no commodity type selected (type-first disclosure). */
  value?: CommoditySelection;
  onChange: (v: CommoditySelection) => void;
  /** Inline validation messages rendered next to the relevant group. */
  errors?: { kind?: string; details?: string; dims?: string };
  /** Render "Cargo details" / "Loading & transport details" group headings. */
  sectionHeadings?: boolean;
}) {
  const eq = getEquipment(value?.equipmentId);
  const industries = EQUIPMENT_INDUSTRIES;
  const categories = useMemo(() => (value?.industry ? equipmentCategories(value.industry) : []), [value?.industry]);
  const makes = useMemo(
    () => (value?.industry && value?.category ? equipmentMakes(value.industry, value.category) : []),
    [value?.industry, value?.category],
  );
  const models = useMemo(
    () => (value?.industry && value?.category && value?.make ? equipmentModels(value.industry, value.category, value.make) : []),
    [value?.industry, value?.category, value?.make],
  );

  const setKind = (kind: CommodityKind) =>
    onChange({ kind, label: "", shipmentType: defaultShipmentForKind(kind), condition: SELF_PROPELLED.includes(kind) ? "operable" : undefined });

  const pickModel = (id: string) => {
    if (!value) return;
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
    <div className="space-y-5">
      <div>
        <Label id="commodity-kind-label" className="mb-2 block">
          Type of commodity<RequiredMark />
        </Label>
        <div role="group" aria-labelledby="commodity-kind-label" className="flex flex-wrap gap-2">
          {KINDS.map((k) => {
            const active = value?.kind === k.value;
            return (
              <button
                key={k.value}
                type="button"
                aria-pressed={active}
                onClick={() => setKind(k.value)}
                className={cn(
                  "rounded-md border px-3.5 py-2 text-sm transition outline-none",
                  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  active
                    ? "border-primary bg-primary font-medium text-primary-foreground shadow-xs"
                    : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-accent/60",
                )}
              >
                {k.label}
              </button>
            );
          })}
        </div>
        {errors?.kind && (
          <p role="alert" className="mt-2 text-xs font-medium text-destructive">{errors.kind}</p>
        )}
      </div>

      {value && (
        <div id="rq-details" className="space-y-5 duration-300 animate-in fade-in slide-in-from-top-1">
          {sectionHeadings && <h3 className="text-sm font-semibold">Cargo details</h3>}
          {value.kind === "equipment" ? (
            <div className="space-y-5">
              <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
                <Field label="Industry" required htmlFor="cp-industry">
                  <Select value={value.industry} onValueChange={(v) => onChange({ ...value, industry: v, category: undefined, make: undefined, equipmentId: undefined })}>
                    <SelectTrigger id="cp-industry" aria-invalid={!!errors?.details && !value.industry} aria-describedby={errors?.details ? "cp-details-error" : undefined}><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>{industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Category" required htmlFor="cp-category">
                  <Select value={value.category} disabled={!value.industry} onValueChange={(v) => onChange({ ...value, category: v, make: undefined, equipmentId: undefined })}>
                    <SelectTrigger id="cp-category" aria-invalid={!!errors?.details && !!value.industry && !value.category} aria-describedby={errors?.details ? "cp-details-error" : undefined}><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Manufacturer" required htmlFor="cp-make">
                  <Select value={value.make} disabled={!value.category} onValueChange={(v) => onChange({ ...value, make: v, equipmentId: undefined })}>
                    <SelectTrigger id="cp-make" aria-invalid={!!errors?.details && !!value.category && !value.make} aria-describedby={errors?.details ? "cp-details-error" : undefined}><SelectValue placeholder="Select make" /></SelectTrigger>
                    <SelectContent>{makes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Model" required htmlFor="cp-model">
                  <Select value={value.equipmentId} disabled={!value.make} onValueChange={pickModel}>
                    <SelectTrigger id="cp-model" aria-invalid={!!errors?.details && !!value.make && !value.equipmentId} aria-describedby={errors?.details ? "cp-details-error" : undefined}><SelectValue placeholder="Select model" /></SelectTrigger>
                    <SelectContent>{models.map((m) => <SelectItem key={m.id} value={m.id}>{m.model}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
              {errors?.details && (
                <p id="cp-details-error" role="alert" className="text-xs font-medium text-destructive">{errors.details}</p>
              )}

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
            </div>
          ) : (
            <div className="space-y-5">
              <Field label="Description" required htmlFor="cp-desc">
                <Input id="cp-desc" value={value.label} placeholder="e.g. Steel coils, yacht, machinery"
                  onChange={(e) => onChange({ ...value, label: e.target.value })}
                  aria-invalid={!!errors?.details}
                  aria-describedby={errors?.details ? "cp-details-error" : undefined} />
              </Field>
              {errors?.details && (
                <p id="cp-details-error" role="alert" className="text-xs font-medium text-destructive">{errors.details}</p>
              )}
              <div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
                  <Dim id="cp-dim-l" label="Length (in)" v={value.dimensions?.lengthIn} invalid={!!errors?.dims} onChange={(n) => onChange({ ...value, dimensions: { ...(value.dimensions ?? blankDims()), lengthIn: n } })} />
                  <Dim id="cp-dim-w" label="Width (in)" v={value.dimensions?.widthIn} invalid={!!errors?.dims} onChange={(n) => onChange({ ...value, dimensions: { ...(value.dimensions ?? blankDims()), widthIn: n } })} />
                  <Dim id="cp-dim-h" label="Height (in)" v={value.dimensions?.heightIn} invalid={!!errors?.dims} onChange={(n) => onChange({ ...value, dimensions: { ...(value.dimensions ?? blankDims()), heightIn: n } })} />
                  <Dim id="cp-dim-wt" label="Weight (lb)" v={value.dimensions?.weightLb} invalid={!!errors?.dims} onChange={(n) => onChange({ ...value, dimensions: { ...(value.dimensions ?? blankDims()), weightLb: n } })} />
                </div>
                {errors?.dims && (
                  <p id="cp-dims-error" role="alert" className="mt-2 text-xs font-medium text-destructive">{errors.dims}</p>
                )}
              </div>
            </div>
          )}

          {sectionHeadings && <h3 className="pt-1 text-sm font-semibold">Loading & transport details</h3>}
          <ShippingOptions value={value} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

// Shipping dropdowns — condition, loading method / shipment type, and container default to
// sensible auto values driven by the commodity (business defaults required by the engine).
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
    <div className="grid gap-x-4 gap-y-5 sm:grid-cols-3">
      {selfProp && (
        <Field label="Unit condition" htmlFor="cp-condition">
          <Select value={value.condition ?? "operable"} onValueChange={(c) => setCondition(c as "operable" | "inoperable")}>
            <SelectTrigger id="cp-condition"><SelectValue placeholder="Select equipment condition" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="operable">Operable (self-propelled)</SelectItem>
              <SelectItem value="inoperable">Non-operable</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      )}
      <Field label={selfProp ? "Loading method" : "Shipment type"} htmlFor="cp-mode">
        <Select value={value.shipmentType} onValueChange={(m) => setMode(m as ShipmentType)}>
          <SelectTrigger id="cp-mode"><SelectValue placeholder="Select loading method" /></SelectTrigger>
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
        <Field label="Container" htmlFor="cp-container">
          <Select value={value.container ?? "40HC"} onValueChange={(c) => onChange({ ...value, container: c as ContainerCode })}>
            <SelectTrigger id="cp-container"><SelectValue /></SelectTrigger>
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
function Field({ label, required, htmlFor, children }: { label: string; required?: boolean; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}{required && <RequiredMark />}</Label>
      {children}
    </div>
  );
}
function Spec({ k, v }: { k: string; v: string }) {
  return <div><span className="block text-caption uppercase tracking-wide">{k}</span><span className="font-medium text-foreground">{v}</span></div>;
}
function Dim({ id, label, v, invalid, onChange }: { id: string; label: string; v?: number; invalid?: boolean; onChange: (n: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Input id={id} type="number" min={0} value={v || ""} aria-invalid={invalid || undefined}
        aria-describedby={invalid ? "cp-dims-error" : undefined}
        onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export function defaultCommodity(): CommoditySelection {
  return { kind: "equipment", label: "", shipmentType: "Container" };
}

export { EQUIPMENT };
