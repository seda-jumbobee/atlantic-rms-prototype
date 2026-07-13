import type { CfsFacility, TruckingType } from "@/lib/types";

// CFS facilities + drayage cost + nearest ramp/port + ZIP, from JB Calc
// (CFS_DRAYAGE_COST + CFS_Types).
export const CFS_FACILITIES: CfsFacility[] = [
  { id: "cfs-1", name: "Los Angeles Transharbour", city: "Los Angeles", state: "CA", zip: "90744", drayageUsd: 1000, nearestRampPort: "LALB", servesAll: false, servedOceanTypes: [1, 2, 3, 4, 5, 6, 7, 12, 13, 14, 15, 16, 17, 18, 19, 20], lat: 33.78, lng: -118.26 },
  { id: "cfs-2", name: "Seattle / Tacoma", city: "Tacoma", state: "WA", zip: "98101", drayageUsd: 1000, nearestRampPort: "USSEA", servesAll: false, lat: 47.25, lng: -122.44 },
  { id: "cfs-3", name: "Hankinson ND / Minneapolis Ramp", city: "Hankinson", state: "ND", zip: "58041", drayageUsd: 1600, nearestRampPort: "USMES", servesAll: false, lat: 46.07, lng: -96.9 },
  { id: "cfs-4", name: "Charleston IL / Chicago Ramp", city: "Charleston", state: "IL", zip: "61920", drayageUsd: 800, nearestRampPort: "USCHI", servesAll: false, lat: 39.5, lng: -88.17 },
  { id: "cfs-5", name: "Dexter MO / St Louis Ramp", city: "Dexter", state: "MO", zip: "63841", drayageUsd: 1500, nearestRampPort: "USSTL", servesAll: false, lat: 36.79, lng: -89.96 },
  { id: "cfs-6", name: "Houston", city: "Houston", state: "TX", zip: "77586", drayageUsd: 700, nearestRampPort: "USHOU", servesAll: true, lat: 29.6, lng: -95.02 },
  { id: "cfs-7", name: "Baltimore", city: "Baltimore", state: "MD", zip: "21222", drayageUsd: 700, nearestRampPort: "USBAL", servesAll: false, lat: 39.26, lng: -76.49 },
  { id: "cfs-8", name: "Savannah", city: "Savannah", state: "GA", zip: "31407", drayageUsd: 700, nearestRampPort: "USSAV", servesAll: true, lat: 32.13, lng: -81.21 },
  { id: "cfs-9", name: "New York Harbour", city: "Newark", state: "NJ", zip: "07114", drayageUsd: 700, nearestRampPort: "USNYC", servesAll: false, lat: 40.69, lng: -74.18 },
  { id: "cfs-10", name: "Miami", city: "Miami", state: "FL", zip: "33166", drayageUsd: 700, nearestRampPort: "USMIA", servesAll: false, lat: 25.81, lng: -80.32 },
  { id: "cfs-12", name: "Jacksonville", city: "Jacksonville", state: "FL", drayageUsd: 700, nearestRampPort: "USJAX", servesAll: false, lat: 30.4, lng: -81.55 },
];

export function getCfs(id?: string): CfsFacility | undefined {
  return id ? CFS_FACILITIES.find((c) => c.id === id) : undefined;
}

// Trucking commodity types 1–28 with $/mile, from JB Calc Trucking_Comm_types.
export const TRUCKING_TYPES: TruckingType[] = [
  { type: 1, dimensions: "0–102\"", weightBand: "legal 0–45,000", trailer: "Step Deck", axles: "5", ratePerMile: 3.0 },
  { type: 2, dimensions: "0–102\"", weightBand: "OW 45,000–52,000", trailer: "Step Deck", axles: "5", ratePerMile: 5.0 },
  { type: 3, dimensions: "102–144\"", weightBand: "legal 0–40,000", trailer: "Step Deck", axles: "5", ratePerMile: 4.5 },
  { type: 4, dimensions: "102–144\"", weightBand: "OW 40,000–52,000", trailer: "RGN/Lowboy", axles: "5", ratePerMile: 5.0 },
  { type: 5, dimensions: "144–156\"", weightBand: "legal 0–40,000", trailer: "RGN/Lowboy", axles: "5", ratePerMile: 6.0 },
  { type: 6, dimensions: "W 144–156\"", weightBand: "OW 40,000–52,000", trailer: "RGN/Lowboy", axles: "5", ratePerMile: 6.0 },
  { type: 7, dimensions: "W 156\"+", weightBand: "OW 52,000–68,000", trailer: "RGN/Lowboy", axles: "6", ratePerMile: 7.5 },
  { type: 8, dimensions: "0–102\" L20–40'", weightBand: "0–15,000", trailer: "Step Deck", axles: "5", ratePerMile: 2.5 },
  { type: 9, dimensions: "102\"+ L20–40'", weightBand: "0–15,000", trailer: "Step Deck", axles: "5", ratePerMile: 2.5 },
  { type: 10, dimensions: "0–102\" L40'+", weightBand: "0–15,000", trailer: "Mafi 45'", axles: "5", ratePerMile: 3.0 },
  { type: 11, dimensions: "102\"+ L40'+", weightBand: "0–15,000", trailer: "Mafi 45'", axles: "5", ratePerMile: 4.0 },
  { type: 12, dimensions: "102–144\"", weightBand: "legal 0–45,000", trailer: "Step Deck (40HC)", axles: "5", ratePerMile: 5.0 },
  { type: 13, dimensions: "144–156\"", weightBand: "legal 0–45,000", trailer: "RGN/Lowboy (2×40HC)", axles: "5", ratePerMile: 5.0 },
  { type: 14, dimensions: "0–102\" L>20'", weightBand: "0–15,000", trailer: "Step Deck (20STD)", axles: "5", ratePerMile: 2.0 },
  { type: 16, dimensions: "156\"+", weightBand: "legal 0–40,000", trailer: "RGN/Lowboy", axles: "5", ratePerMile: 8.0 },
  { type: 19, dimensions: "102–144\"", weightBand: "OW 52,000–68,000", trailer: "RGN/Lowboy", axles: "6", ratePerMile: 7.0 },
  { type: 21, dimensions: "102–144\"", weightBand: "OW 68,000–75,000", trailer: "RGN/Lowboy", axles: "7–8", ratePerMile: 8.0 },
  { type: 22, dimensions: "102–144\"", weightBand: "75,000–90,000", trailer: "RGN/Lowboy", axles: "8", ratePerMile: 10.0 },
  { type: 23, dimensions: "102–144\"", weightBand: "90,000–115,000", trailer: "RGN/Lowboy", axles: "8–9", ratePerMile: 15.0 },
  { type: 28, dimensions: "102–144\"", weightBand: "OW 115,000–150,000", trailer: "Lowboy", axles: "9–11", ratePerMile: 20.0 },
];

export function getTruckingType(type: number): TruckingType | undefined {
  return TRUCKING_TYPES.find((t) => t.type === type);
}

// Loading / handling cost lookup keyed by ocean commodity type, from JB Calc Our_Comm_types.
export interface LoadingRule {
  oceanTypes: number[];
  loadType: string;
  container: string;
  loadCost: number; // base flat $ (per-unit rules noted)
  drayage: number;
  margin: number;
  perUnitNote?: string;
  unitsPerContainer?: number;
}

export const LOADING_RULES: LoadingRule[] = [
  { oceanTypes: [14, 15], loadType: "Compact / LTL", container: "20DC", loadCost: 1000, drayage: 1500, margin: 1000 },
  { oceanTypes: [1], loadType: "All Purpose", container: "40HC", loadCost: 3000, drayage: 1500, margin: 2000 },
  { oceanTypes: [2, 3, 4, 5, 6, 7, 13, 16], loadType: "All Purpose (Flat Rack)", container: "40FR", loadCost: 4500, drayage: 0, margin: 4000 },
  { oceanTypes: [8], loadType: "Draper Header", container: "40HC", loadCost: 2000, drayage: 1500, margin: 1500, unitsPerContainer: 2 },
  { oceanTypes: [9], loadType: "Corn Head", container: "40HC", loadCost: 0, drayage: 1500, margin: 3000, perUnitNote: "$130 / row", unitsPerContainer: 3 },
  { oceanTypes: [10], loadType: "Flex Head", container: "40HC", loadCost: 1600, drayage: 1500, margin: 1500, unitsPerContainer: 4 },
  { oceanTypes: [11], loadType: "Header > 40' — RoRo", container: "RORO", loadCost: 0, drayage: 27100, margin: 3500, perUnitNote: "$163 / CBM (by port)" },
  { oceanTypes: [12], loadType: "Air Drill", container: "40HC", loadCost: 0, drayage: 1500, margin: 3000, perUnitNote: "$140 / ft (max 60 ft)" },
];
