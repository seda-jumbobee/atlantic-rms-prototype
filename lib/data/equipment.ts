import type { EquipmentModel } from "@/lib/types";

// Sample of the JB Calc equipment master catalog (3,637 models in the real sheet).
// The cascade: Industry → Product Type → Category → Type → Make → Model →
// auto-fills Trucking Type + Ocean Type + Container + Dimensions + Weight.
export const EQUIPMENT: EquipmentModel[] = [
  // ── Material Handling — forklifts (the US → Egypt demo commodity) ──
  { id: "e-hyster-h50", industry: "Material Handling", productType: "Forklifts", category: "Counterbalance", type: "Diesel Forklift", make: "Hyster", model: "H50FT", dimensions: { lengthIn: 138, widthIn: 49, heightIn: 84, weightLb: 8400 }, truckingType: 14, oceanType: 14, container: "20DC", loadingNotes: "Standard fit, drive-in load" },
  { id: "e-toyota-8fgu25", industry: "Material Handling", productType: "Forklifts", category: "Counterbalance", type: "LPG Forklift", make: "Toyota", model: "8FGU25", dimensions: { lengthIn: 142, widthIn: 45, heightIn: 83, weightLb: 8700 }, truckingType: 14, oceanType: 14, container: "20DC", loadingNotes: "Standard fit" },
  { id: "e-cat-dp70", industry: "Material Handling", productType: "Forklifts", category: "Heavy Counterbalance", type: "Diesel Forklift", make: "Caterpillar", model: "DP70N1", dimensions: { lengthIn: 191, widthIn: 84, heightIn: 113, weightLb: 23800 }, truckingType: 3, oceanType: 3, container: "40FR", loadingNotes: "Over-width — flat rack" },

  // ── Farm — tractors ──
  { id: "e-jd-5130m", industry: "Farm", productType: "Tractors", category: "Tractors", type: "Utility / All Purpose", make: "John Deere", model: "5130M", dimensions: { lengthIn: 168, widthIn: 96, heightIn: 110, weightLb: 12500 }, truckingType: 14, oceanType: 1, container: "40HC" },
  { id: "e-case-steiger400", industry: "Farm", productType: "Tractors", category: "Tractors", type: "4WD", make: "Case IH", model: "Steiger 400 HD", dimensions: { lengthIn: 268, widthIn: 144, heightIn: 138, weightLb: 38000 }, truckingType: 3, oceanType: 3, container: "40FR", loadingNotes: "Over-width — flat rack" },
  { id: "e-nh-t9470", industry: "Farm", productType: "Tractors", category: "Tractors", type: "4WD", make: "New Holland", model: "T9.470", dimensions: { lengthIn: 270, widthIn: 142, heightIn: 140, weightLb: 47000 }, truckingType: 4, oceanType: 4, container: "40FR", loadingNotes: "Overweight — RGN trucking + flat rack" },
  { id: "e-jd-8r410", industry: "Farm", productType: "Tractors", category: "Tractors", type: "Row Crop", make: "John Deere", model: "8R 410", dimensions: { lengthIn: 240, widthIn: 120, heightIn: 134, weightLb: 36000 }, truckingType: 3, oceanType: 3, container: "40FR" },

  // ── Farm — combines / harvesters ──
  { id: "e-jd-s770", industry: "Farm", productType: "Combines", category: "Harvesters", type: "Combine", make: "John Deere", model: "S770", dimensions: { lengthIn: 372, widthIn: 152, heightIn: 158, weightLb: 38500 }, truckingType: 5, oceanType: 5, container: "40FR", loadingNotes: "Remove headers/wheels for width; flat rack" },
  { id: "e-jd-6600", industry: "Farm", productType: "Combines", category: "Harvesters", type: "Combine", make: "John Deere", model: "6600", dimensions: { lengthIn: 340, widthIn: 140, heightIn: 150, weightLb: 26000 }, truckingType: 5, oceanType: 5, container: "40FR" },
  { id: "e-case-9240", industry: "Farm", productType: "Combines", category: "Harvesters", type: "Combine", make: "Case IH", model: "9240", dimensions: { lengthIn: 360, widthIn: 156, heightIn: 160, weightLb: 41000 }, truckingType: 6, oceanType: 6, container: "40FR" },

  // ── Farm — headers (RoRo when >40') ──
  { id: "e-jd-635fd", industry: "Farm", productType: "Headers", category: "Draper Header", type: "Header", make: "John Deere", model: "635FD", dimensions: { lengthIn: 449, widthIn: 96, heightIn: 63, weightLb: 8000, cbm: 43.78 }, truckingType: 8, oceanType: 8, container: "40HC", unitsPerContainer: 2 },
  { id: "e-macdon-fd140", industry: "Farm", productType: "Headers", category: "Draper Header", type: "Header", make: "MacDon", model: "FD140", dimensions: { lengthIn: 531, widthIn: 96, heightIn: 69, weightLb: 9200, cbm: 57.88 }, truckingType: 11, oceanType: 11, container: "RORO", loadingNotes: "Over 40' — must ship RoRo (priced per CBM)" },

  // ── Farm — sprayers ──
  { id: "e-jd-r4045", industry: "Farm", productType: "Sprayers", category: "Self-Propelled Sprayers", type: "Sprayer", make: "John Deere", model: "R4045", dimensions: { lengthIn: 320, widthIn: 156, heightIn: 152, weightLb: 33000 }, truckingType: 5, oceanType: 5, container: "40FR" },
  { id: "e-miller-nitro", industry: "Farm", productType: "Sprayers", category: "Self-Propelled Sprayers", type: "Sprayer", make: "Miller", model: "Nitro 7310", dimensions: { lengthIn: 330, widthIn: 168, heightIn: 156, weightLb: 35000 }, truckingType: 16, oceanType: 16, container: "40FR" },

  // ── Construction — excavators ──
  { id: "e-cat-320", industry: "Construction", productType: "Excavators", category: "Crawler Excavators", type: "Excavator", make: "Caterpillar", model: "320", dimensions: { lengthIn: 386, widthIn: 102, heightIn: 120, weightLb: 49000 }, truckingType: 12, oceanType: 1, container: "40HC", loadingNotes: "Boom removed to fit HC" },
  { id: "e-jd-1023e", industry: "Construction", productType: "Excavators", category: "Crawler Excavators", type: "Crawler Excavator", make: "John Deere", model: "1023E", dimensions: { lengthIn: 110, widthIn: 38, heightIn: 90, weightLb: 2700 }, truckingType: 8, oceanType: 14, container: "20DC" },
  { id: "e-komatsu-pc210", industry: "Construction", productType: "Excavators", category: "Crawler Excavators", type: "Excavator", make: "Komatsu", model: "PC210", dimensions: { lengthIn: 380, widthIn: 110, heightIn: 118, weightLb: 48500 }, truckingType: 12, oceanType: 3, container: "40FR" },

  // ── Construction — dozers / loaders ──
  { id: "e-cat-d6", industry: "Construction", productType: "Dozers", category: "Crawler Dozers", type: "Crawler Dozer", make: "Caterpillar", model: "D6", dimensions: { lengthIn: 220, widthIn: 134, heightIn: 130, weightLb: 44000 }, truckingType: 5, oceanType: 5, container: "40FR" },
  { id: "e-cat-966", industry: "Construction", productType: "Wheel Loaders", category: "Wheel Loaders", type: "Wheel Loader", make: "Caterpillar", model: "966M", dimensions: { lengthIn: 330, widthIn: 120, heightIn: 138, weightLb: 51000 }, truckingType: 5, oceanType: 5, container: "40FR" },

  // ── Construction — boom lifts / aerial (Boom Lifts Logic) ──
  { id: "e-jlg-400s", industry: "Construction", productType: "Boom Lifts", category: "Telescopic Boom", type: "Boom Lift", make: "JLG", model: "400S", dimensions: { lengthIn: 298, widthIn: 90, heightIn: 97, weightLb: 13640 }, truckingType: 10, oceanType: 10, container: "40HC", loadingNotes: "Standard 40HC" },
  { id: "e-jlg-1250ajp", industry: "Construction", productType: "Boom Lifts", category: "Articulating Boom", type: "Boom Lift", make: "JLG", model: "1250AJP", dimensions: { lengthIn: 451, widthIn: 98, heightIn: 119, weightLb: 44000 }, truckingType: 16, oceanType: 11, container: "RORO", loadingNotes: "Oversized — RoRo; dismantle basket" },
  { id: "e-genie-z45fe", industry: "Construction", productType: "Boom Lifts", category: "Articulating Boom", type: "Boom Lift", make: "Genie", model: "Z-45 FE", dimensions: { lengthIn: 241, widthIn: 90, heightIn: 90, weightLb: 14460 }, truckingType: 10, oceanType: 10, container: "40HC" },
  { id: "e-haulotte-ha32", industry: "Construction", productType: "Boom Lifts", category: "Articulating Boom", type: "Boom Lift", make: "Haulotte", model: "HA32 CJ", dimensions: { lengthIn: 211, widthIn: 47, heightIn: 78, weightLb: 15578 }, truckingType: 8, oceanType: 14, container: "20DC", loadingNotes: "Standard 20'DC fit" },
  { id: "e-manitou-atj46", industry: "Construction", productType: "Boom Lifts", category: "Articulating Boom", type: "Boom Lift", make: "Manitou", model: "ATJ 46+", dimensions: { lengthIn: 279, widthIn: 96, heightIn: 97, weightLb: 16535 }, truckingType: 10, oceanType: 10, container: "40HC" },
];

// Build the cascade lookup helpers for the commodity selector.
export const EQUIPMENT_INDUSTRIES = Array.from(new Set(EQUIPMENT.map((e) => e.industry)));

export function equipmentCategories(industry: string): string[] {
  return Array.from(new Set(EQUIPMENT.filter((e) => e.industry === industry).map((e) => e.category)));
}
export function equipmentMakes(industry: string, category: string): string[] {
  return Array.from(
    new Set(EQUIPMENT.filter((e) => e.industry === industry && e.category === category).map((e) => e.make)),
  );
}
export function equipmentModels(industry: string, category: string, make: string): EquipmentModel[] {
  return EQUIPMENT.filter((e) => e.industry === industry && e.category === category && e.make === make);
}
export function getEquipment(id?: string): EquipmentModel | undefined {
  return id ? EQUIPMENT.find((e) => e.id === id) : undefined;
}
