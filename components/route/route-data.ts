// Custom Route — shared route helpers (kinds, defaults, cost breakdown, sample,
// geo points). Pure data/logic so the orchestrator and step components agree.

import type {
  RouteStep, RouteStepKind, QuoteLeg, LegKind, VendorServiceKind, ChargeLine, Vendor,
} from "@/lib/types";
import { VENDORS, vendorsForService, getPort, getAddress } from "@/lib/data";
import { seeded, daysFromNow } from "@/lib/format";
import { chargeTotal } from "@/lib/quote-engine";
import { getStepMeta } from "@/components/route/add-step-menu";
import type { LocationValue } from "@/components/location-combobox";
import type { CommoditySelection } from "@/components/commodity-picker";
import type { MapPoint } from "@/components/map-preview";
import type { SearchInput } from "@/lib/quote-engine";

/** Build the shared ShipmentSummary/quote input from the Custom Route selections.
    Custom Route reuses the same summary card as Rate Quote; the commodity here
    only filters vendors/contracts and does not drive the whole calculation. */
export function routeSearchInput(origin?: LocationValue, dest?: LocationValue, commodity?: CommoditySelection): SearchInput | undefined {
  if (!origin || !dest || !commodity) return undefined;
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
    advancedSearch: false,
    condition: commodity.condition,
    dimensions: commodity.equipmentId ? undefined : commodity.dimensions,
  };
}

let seq = 0;
export const nextId = () => `step-${++seq}-${Math.floor(seeded(String(seq)) * 1e6)}`;

// route stage kinds a manager can add (commodity is handled in Shipment details)
export const LEG_KINDS: RouteStepKind[] = [
  "trucking", "rail", "disassembly", "washing", "loading", "cfs_packing", "drayage", "ocean", "oncarriage", "custom", "ai_vendor",
];

const LEG_SERVICE: Partial<Record<RouteStepKind, VendorServiceKind>> = {
  trucking: "trucking", rail: "rail", loading: "loading", disassembly: "disassembly",
  washing: "washing", cfs_packing: "packing", drayage: "drayage", oncarriage: "trucking", ai_vendor: "trucking",
};

export const LEG_TO_QUOTE: Record<RouteStepKind, LegKind> = {
  commodity: "preparation", trucking: "inland", rail: "inland", disassembly: "loading", washing: "loading",
  loading: "loading", cfs_packing: "cfs", drayage: "drayage", ocean: "ocean", oncarriage: "oncarriage",
  custom: "preparation", ai_vendor: "oncarriage",
};

export function vendorOptions(kind: RouteStepKind): Vendor[] {
  const svc = LEG_SERVICE[kind];
  const list = svc ? vendorsForService(svc) : [];
  return list.length ? list : VENDORS;
}

let chSeq = 0;
/** Break an ocean total into a realistic base + surcharge breakdown. */
export function oceanCharges(total: number): ChargeLine[] {
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
export const sumCharges = (charges?: ChargeLine[]) => (charges ?? []).reduce((s, c) => s + chargeTotal(c), 0);

export function defaultsFor(kind: RouteStepKind): Omit<RouteStep, "id"> {
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

export const OCEAN_OFFERS = [
  { carrierId: "c-maersk", cost: 4380, days: 26 }, { carrierId: "c-msc", cost: 3950, days: 31 },
  { carrierId: "c-hapag", cost: 4620, days: 24 }, { carrierId: "c-cma", cost: 4120, days: 28 },
  { carrierId: "c-one", cost: 3880, days: 30 }, { carrierId: "c-cosco", cost: 3990, days: 33 },
];

/** A sample route (US → Baku) with a mix of confirmed, selected, and to-be-sourced
    stages — the last stage is intentionally left for AI sourcing. */
export function exampleLegs(): RouteStep[] {
  return [
    { id: nextId(), kind: "trucking", icon: "Truck", status: "set", provenance: "contract", title: "Inland Trucking", detail: "RGN flatbed, 1,080 mi", location: "Charleston, IL", toLocation: "Houston CFS", vendorId: "v-rgntrans", dataSourceId: "ds-custom-jrl", cost: 3240, durationDays: 3 },
    { id: nextId(), kind: "disassembly", icon: "Wrench", status: "set", provenance: "manual", title: "Disassembly & Wash", detail: "Header off, steam clean", location: "Houston CFS", vendorId: "v-morris", cost: 1250, durationDays: 1 },
    { id: nextId(), kind: "cfs_packing", icon: "Container", status: "set", provenance: "manual", title: "CFS Packing — 40FR", detail: "Stuff & lash on 40' flat rack", location: "Houston CFS", vendorId: "v-morris", cost: 2500, durationDays: 1 },
    { id: nextId(), kind: "ocean", icon: "Ship", status: "quoted", provenance: "api", title: "Ocean Freight", detail: "40FR all-in incl. surcharges", location: "Houston, US", toLocation: "Poti, GE", carrierId: "c-msc", dataSourceId: "ds-msc-api", cost: 6850, durationDays: 34, charges: oceanCharges(6850), vessel: "MSC Allegra / 118E", sailingDate: daysFromNow(9), freeDaysPod: 10 },
    { id: nextId(), kind: "ai_vendor", icon: "Sparkles", status: "pending_ai", title: "On-carriage (Poti → Baku)", detail: "Regional truck — needs AI sourcing", location: "Poti, GE", toLocation: "Baku, AZ", cost: 0, durationDays: 0 },
  ];
}

export function pointFromLocation(v?: LocationValue): MapPoint | undefined {
  if (!v) return undefined;
  if (v.kind === "port") { const p = getPort(v.id); return p ? { lat: p.lat, lng: p.lng, label: p.name } : undefined; }
  const a = getAddress(v.id); return a ? { lat: a.lat, lng: a.lng, label: a.city } : undefined;
}
