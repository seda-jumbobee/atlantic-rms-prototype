import type { CalculatorMeta } from "@/lib/types";

export const CALCULATORS: CalculatorMeta[] = [
  { id: "shipping-lines", name: "Shipping Lines Search", description: "Compare live ocean freight across carriers and contracts for a lane.", icon: "Ship", unit: "per container" },
  { id: "trucking", name: "US / Canada Trucking", description: "Inland trucking by dimensions + weight band; RGN/Lowboy & step-deck rates per mile.", icon: "Truck", unit: "$ / mile", region: "US / Canada" },
  { id: "loading", name: "Loading Calculator", description: "CFS loading & warehouse handling cost by commodity (flat / per row / per ft / per shank).", icon: "Forklift", unit: "per unit / per ft" },
  { id: "roro", name: "RoRo Calculator", description: "Roll-on/roll-off priced per W/M on CBM, with BAF / ECA / EU-ETS stacking.", icon: "CarFront", unit: "per W/M (CBM)" },
  { id: "ocean-freight", name: "Ocean Freight Calculator", description: "Base ocean rate plus applicable carrier surcharges by lane & container.", icon: "Container", unit: "per container" },
  { id: "drayage", name: "Drayage Calculator", description: "CFS → port container drayage by US port with accessorials (pre-pull, reefer, weekend).", icon: "TruckElectric", unit: "per container", region: "US" },
  { id: "oog", name: "OOG / Lost-Slot Calculator", description: "Out-of-gauge over-dimension cargo → lost TEU slots on a 40' flat rack.", icon: "Maximize", unit: "lost TEU" },
  { id: "cbm", name: "CBM & Container Fit", description: "Volume / weight totals and how many units fit a container.", icon: "Box", unit: "CBM" },
  { id: "equipment-dims", name: "Equipment Dimension Lookup", description: "Search the equipment database for dimensions, weight, container & loading rules.", icon: "Ruler", unit: "dimensions" },
  { id: "air-freight", name: "Air Freight (Chargeable Weight)", description: "Chargeable weight = max(actual, volumetric) × rate/kg, for air shipments.", icon: "Plane", unit: "per kg" },
  { id: "demurrage", name: "Demurrage & Detention", description: "Per-diem D&D once free days at POL/POD are exceeded.", icon: "Timer", unit: "per day" },
  { id: "insurance", name: "Cargo Insurance", description: "All-risk premium on declared cargo value (CIF basis).", icon: "ShieldCheck", unit: "% of value" },
  { id: "customs", name: "Customs / Import Duty", description: "Estimate import duty, MPF/HMF and brokerage on declared value (vehicles & equipment).", icon: "Landmark", unit: "% + fees" },
];

export function getCalculator(id: string): CalculatorMeta | undefined {
  return CALCULATORS.find((c) => c.id === id);
}
