import type { CalculatorMeta, CalculatorCategory } from "@/lib/types";

export const CALCULATOR_CATEGORY_LABEL: Record<CalculatorCategory, string> = {
  "freight-routing": "Freight & Routing",
  "cargo-equipment": "Cargo & Equipment",
  "costs-compliance": "Costs & Compliance",
};

export const CALCULATORS: CalculatorMeta[] = [
  { id: "shipping-lines", name: "Shipping Lines Search", description: "Compare live carrier rates for a port-to-port lane.", icon: "Ship", unit: "per container", category: "freight-routing", toolType: "rate-search" },
  { id: "trucking", name: "US / Canada Trucking", description: "Estimate inland trucking cost by dimensions, weight, and distance.", icon: "Truck", unit: "$ / mile", region: "US / Canada", category: "freight-routing", toolType: "calculator" },
  { id: "ocean-freight", name: "Ocean Freight Calculator", description: "Estimate base ocean freight plus applicable carrier surcharges.", icon: "Container", unit: "per container", category: "freight-routing", toolType: "calculator" },
  { id: "drayage", name: "Drayage Calculator", description: "Estimate CFS-to-port drayage cost with accessorials.", icon: "TruckElectric", unit: "per container", region: "US", category: "freight-routing", toolType: "calculator" },
  { id: "roro", name: "RoRo Calculator", description: "Estimate roll-on/roll-off cost by cargo volume.", icon: "CarFront", unit: "per W/M (CBM)", category: "freight-routing", toolType: "calculator" },
  { id: "air-freight", name: "Air Freight (Chargeable Weight)", description: "Calculate chargeable weight and cost for an air shipment.", icon: "Plane", unit: "per kg", category: "freight-routing", toolType: "calculator" },

  { id: "loading", name: "Loading Calculator", description: "Estimate CFS loading and handling cost for a commodity.", icon: "Forklift", unit: "per unit / per ft", category: "cargo-equipment", toolType: "calculator" },
  { id: "oog", name: "OOG / Lost-Slot Calculator", description: "Estimate added space and cost for oversized cargo.", icon: "Maximize", unit: "lost TEU", category: "cargo-equipment", toolType: "calculator" },
  { id: "cbm", name: "CBM & Container Fit", description: "Check cargo volume and whether it fits inside a container.", icon: "Box", unit: "CBM", category: "cargo-equipment", toolType: "calculator" },
  { id: "equipment-dims", name: "Equipment Dimension Lookup", description: "Look up equipment dimensions, weight, and container rules.", icon: "Ruler", unit: "dimensions", category: "cargo-equipment", toolType: "calculator" },

  { id: "demurrage", name: "Demurrage & Detention", description: "Estimate per-diem charges once free days are used.", icon: "Timer", unit: "per day", category: "costs-compliance", toolType: "calculator" },
  { id: "insurance", name: "Cargo Insurance", description: "Estimate cargo insurance from shipment value and coverage.", icon: "ShieldCheck", unit: "% of value", category: "costs-compliance", toolType: "calculator" },
  { id: "customs", name: "Customs / Import Duty", description: "Estimate import duty, taxes, and fees on declared value.", icon: "Landmark", unit: "% + fees", category: "costs-compliance", toolType: "calculator" },
];

export function getCalculator(id: string): CalculatorMeta | undefined {
  return CALCULATORS.find((c) => c.id === id);
}
