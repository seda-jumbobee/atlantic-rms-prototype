import type { CommodityKind, ShipmentType, ContainerCode } from "@/lib/types";

// Which workflow a template feeds. The data model currently only holds Rate Quote
// templates; Custom Route templates are creatable from that flow (none seeded yet),
// and Calculation templates are not supported (calculators have no save-as-template).
export type TemplateType = "rate-quote" | "custom-route" | "calculation";

export const TEMPLATE_TYPE_LABEL: Record<TemplateType, string> = {
  "rate-quote": "Rate Quote",
  "custom-route": "Custom Route",
  calculation: "Calculation",
};

// Saved quote templates — frequently-repeated origin/destination + service sets
// (Nick: "ready-to-use templates for repeated lanes e.g. LA → Shanghai").
export interface QuoteTemplate {
  id: string;
  type: TemplateType;
  name: string;
  description: string;
  originPortId?: string;
  originAddressId?: string;
  destPortId?: string;
  destAddressId?: string;
  equipmentId?: string;
  commodityKind: CommodityKind;
  commodityLabel: string;
  shipmentType: ShipmentType;
  container?: ContainerCode;
  services: string[]; // leg labels prefilled
  usageCount: number;
  lastUsed: string;
}

export const QUOTE_TEMPLATES: QuoteTemplate[] = [
  {
    type: "rate-quote", id: "tpl-la-shanghai", name: "LA → Shanghai · 40HC tractor",
    description: "Standard containerized farm tractor, West-coast gateway.",
    originPortId: "p-uslax", destPortId: "p-cnsha", equipmentId: "e-jd-5130m",
    commodityKind: "equipment", commodityLabel: "John Deere 5130M", shipmentType: "Container", container: "40HC",
    services: ["Loading / CFS", "Container drayage", "Ocean freight"], usageCount: 28, lastUsed: "2026-06-22T09:00:00Z",
  },
  {
    type: "rate-quote", id: "tpl-hou-alex-forklift", name: "Houston → Alexandria · forklift",
    description: "Forklift to Egypt — incl. ACID; fumigation flagged for AI sourcing.",
    originPortId: "p-ushou", destPortId: "p-egaly", equipmentId: "e-hyster-h50",
    commodityKind: "equipment", commodityLabel: "Hyster H50FT Forklift", shipmentType: "Container", container: "20DC",
    services: ["Loading / CFS", "Container drayage", "Ocean freight", "ACID"], usageCount: 14, lastUsed: "2026-06-21T14:00:00Z",
  },
  {
    type: "rate-quote", id: "tpl-bal-brv-roro", name: "Baltimore → Bremerhaven · RoRo combine",
    description: "Self-propelled combine RoRo to N. Europe (per-W/M).",
    originPortId: "p-usbal", destPortId: "p-debrv", equipmentId: "e-jd-s770",
    commodityKind: "equipment", commodityLabel: "John Deere S770 Combine", shipmentType: "RoRo",
    services: ["Inland trucking", "Ocean freight (RoRo)"], usageCount: 11, lastUsed: "2026-06-20T11:30:00Z",
  },
  {
    type: "rate-quote", id: "tpl-sav-mel-fr", name: "Savannah → Melbourne · 40FR combine",
    description: "Flat-rack combine to Australia — fumigation required.",
    originPortId: "p-ussav", destPortId: "p-aumel", equipmentId: "e-case-9240",
    commodityKind: "equipment", commodityLabel: "Case IH 9240 Combine", shipmentType: "Flatrack", container: "40FR",
    services: ["Loading / CFS", "Container drayage", "Ocean freight", "Fumigation", "NCB"], usageCount: 7, lastUsed: "2026-06-23T06:05:00Z",
  },
  {
    type: "rate-quote", id: "tpl-mia-genoa-yacht", name: "Miami → Genoa · yacht RoRo",
    description: "Sub-24m yacht, RoRo / lift-on-lift-off to Med.",
    originPortId: "p-usbru", destPortId: "p-itgoa",
    commodityKind: "boat", commodityLabel: "Motor yacht ≤ 24m", shipmentType: "RoRo",
    services: ["Inland trucking", "Ocean freight (RoRo)", "EORI"], usageCount: 5, lastUsed: "2026-06-16T10:00:00Z",
  },
];

export function getTemplate(id: string): QuoteTemplate | undefined {
  return QUOTE_TEMPLATES.find((t) => t.id === id);
}
