import type { SurchargeCode } from "@/lib/types";

// Curated surcharge dictionary from the CMA Charges Glossary (Applicable flags),
// the Maersk glossary, and the Wisor cost-breakdown codes.
export const SURCHARGES: SurchargeCode[] = [
  // Ocean freight & fuel
  { code: "BAS", name: "Basic Ocean Freight", applicable: true, basis: "Container", leg: "ocean" },
  { code: "BAF", name: "Bunker Adjustment Factor", carrierId: "c-cma", applicable: true, basis: "Container", leg: "ocean" },
  { code: "EBS", name: "Emergency Bunker Surcharge", applicable: true, basis: "Container", leg: "ocean" },
  { code: "LSS", name: "Low Sulphur Surcharge", applicable: true, basis: "Container", leg: "ocean" },
  { code: "ECA", name: "Emission Control Areas", applicable: true, basis: "Container", leg: "ocean" },
  { code: "GFS", name: "Global Fuel Surcharge", applicable: true, basis: "Container", leg: "ocean" },
  { code: "CLS", name: "China Low Sulphur", applicable: true, basis: "Container", leg: "ocean" },
  { code: "EU-ETS", name: "EU Emissions Trading System", applicable: true, basis: "W/M", leg: "ocean" },
  { code: "PSS", name: "Peak Season Surcharge", applicable: true, basis: "Container", leg: "ocean" },
  { code: "GRI", name: "General Rate Increase", carrierId: "c-cma", applicable: true, basis: "Container", leg: "ocean" },
  { code: "PCC", name: "Panama Canal Charge", applicable: true, basis: "Container", leg: "ocean" },
  // Terminal handling
  { code: "OHC", name: "Terminal Handling — Origin", applicable: true, basis: "Container", leg: "drayage" },
  { code: "THC", name: "Terminal Handling Charge", applicable: true, basis: "Container", leg: "ocean" },
  { code: "DTHC", name: "Destination Terminal Handling", carrierId: "c-cma", applicable: true, basis: "Container", leg: "oncarriage" },
  { code: "HHC", name: "Heavyweight Handling Charge", applicable: true, basis: "Container", leg: "ocean" },
  { code: "WFG", name: "Wharfage", applicable: true, basis: "W/M", leg: "ocean" },
  // Documentation
  { code: "ODF", name: "Documentation Fee — Origin", applicable: true, basis: "Bill of Lading", leg: "ocean" },
  { code: "DDF", name: "Documentation Fee — Destination", applicable: true, basis: "Bill of Lading", leg: "oncarriage" },
  { code: "BL", name: "Bill of Lading Fee", applicable: true, basis: "Bill of Lading", leg: "ocean" },
  { code: "EDI", name: "Electronic Data Interchange Fee", applicable: true, basis: "Bill of Lading", leg: "ocean" },
  { code: "VGM", name: "Verified Gross Mass Charge", applicable: true, basis: "Container", leg: "ocean" },
  { code: "ISPS", name: "ISPS / Security Charge", applicable: true, basis: "Container", leg: "ocean" },
  // Customs
  { code: "CCO", name: "Customs Clearance — Origin", applicable: true, basis: "Shipment", leg: "preparation" },
  { code: "CCD", name: "Customs Clearance — Destination", carrierId: "c-cma", applicable: true, basis: "Shipment", leg: "oncarriage" },
  { code: "ISF", name: "Import Security Filing", applicable: true, basis: "Shipment", leg: "preparation" },
  { code: "CUI", name: "Customs Inspections", applicable: true, basis: "Shipment", leg: "oncarriage" },
  // Inland / haulage
  { code: "IHE", name: "Inland Haulage — Export", applicable: true, basis: "Container", leg: "inland" },
  { code: "EFS", name: "Export Intermodal Fuel Fee", applicable: true, basis: "Container", leg: "inland" },
  { code: "PPE", name: "Pre-Pull Service — Export", applicable: true, basis: "Container", leg: "drayage" },
  { code: "TRE", name: "Triaxle Chassis — Export", applicable: true, basis: "Container", leg: "drayage" },
  { code: "CPC", name: "Chassis Provision Charge", carrierId: "c-cma", applicable: true, basis: "Container", leg: "drayage" },
  // Cargo care / conditional
  { code: "LAS", name: "Lashing & Securing", applicable: true, basis: "Container", leg: "loading" },
  { code: "HAZ", name: "Hazardous Fees (Ocean)", carrierId: "c-cma", applicable: true, basis: "Container", leg: "ocean" },
  { code: "SOC", name: "Shipper-Owned Container", carrierId: "c-cma", applicable: true, basis: "Container", leg: "ocean" },
  { code: "DOF", name: "Delivery Order Fee", applicable: true, basis: "Bill of Lading", leg: "oncarriage" },
  { code: "CDD", name: "Cargo Data Declaration", applicable: true, basis: "Bill of Lading", leg: "oncarriage" },
  { code: "WR", name: "War Risk Surcharge", applicable: true, basis: "W/M", leg: "ocean" },
  // Not applicable examples (still in glossary, APC does not charge)
  { code: "CFC", name: "Cargo Facility Charge", carrierId: "c-cma", applicable: false, basis: "Container", leg: "ocean" },
  { code: "CSF", name: "Carrier Security Fee", carrierId: "c-cma", applicable: false, basis: "Container", leg: "ocean" },
];

export function getSurcharge(code: string): SurchargeCode | undefined {
  return SURCHARGES.find((s) => s.code === code);
}

// ONE "Country → applicable destination surcharges" map (from the ONE country chart).
export const COUNTRY_SURCHARGES: Record<string, string[]> = {
  AE: ["DTHC", "PF", "WR"],
  AU: ["DTHC", "SC", "EH", "AE", "AT", "VS"],
  CN: ["DDF", "AH"],
  EG: ["DTHC", "ACID"],
  IN: ["DTHC", "VX", "EQ"],
  JP: ["DDF", "DTHC", "AH", "IP"],
  KR: ["DDF", "DTHC"],
  SA: ["OC", "PF", "WR"],
  SG: ["DDF", "DTHC"],
  TW: ["DDF", "DTHC", "SJ"],
  VN: ["DDF", "DTHC", "EQ"],
};
