import type { Vendor, DataSource } from "@/lib/types";

// Inland / loading / service vendors ("agents"), tiered 1st/2nd/3rd by capability.
// 1st class owns equipment (crane), widest service pool, gets most shipments.
export const VENDORS: Vendor[] = [
  {
    id: "v-jrl", name: "JRL Heavy Lift (Baltimore)", tier: 1, coast: "East",
    services: ["loading", "disassembly", "fastening", "certification", "drayage", "warehouse", "inspection"],
    ownsEquipment: true, baseLocation: "Baltimore, MD", cfsId: "cfs-7", rating: 4.8,
    notes: "Owns 90-ton crane; preferred for expensive / oversized cargo.", contactEmail: "ops@jrlheavylift.com", contactPhone: "+1 (410) 555-0142",
  },
  {
    id: "v-tro", name: "TRO Terminal Services (Savannah)", tier: 1, coast: "East",
    services: ["loading", "disassembly", "fastening", "drayage", "warehouse", "tire_service"],
    ownsEquipment: true, baseLocation: "Savannah, GA", cfsId: "cfs-8", rating: 4.7,
    contactEmail: "dispatch@troterminal.com", contactPhone: "+1 (912) 555-0188",
  },
  {
    id: "v-longroad", name: "Long Road Rigging (Seattle/Tacoma)", tier: 2, coast: "West",
    services: ["loading", "fastening", "drayage", "washing"],
    ownsEquipment: false, baseLocation: "Tacoma, WA", cfsId: "cfs-2", rating: 4.3,
    notes: "Loading by drivers; cheaper, no owned crane.", contactEmail: "info@longroadrigging.com",
  },
  {
    id: "v-morris", name: "Morris Cargo Handling (Houston)", tier: 1, coast: "Gulf",
    services: ["loading", "disassembly", "fastening", "certification", "drayage", "warehouse", "washing"],
    ownsEquipment: true, baseLocation: "Houston, TX", cfsId: "cfs-6", rating: 4.6,
    contactEmail: "quotes@morriscargo.com", contactPhone: "+1 (281) 555-0119",
  },
  {
    id: "v-rgntrans", name: "RGN Transport Co.", tier: 1, coast: "Inland",
    services: ["trucking"], ownsEquipment: true, baseLocation: "Chicago, IL", cfsId: "cfs-4", rating: 4.5,
    notes: "RGN/Lowboy fleet for over-dimension inland (~$6/mile combines).", contactEmail: "dispatch@rgntransport.com",
  },
  {
    id: "v-midwestdray", name: "Midwest Drayage LLC", tier: 2, coast: "Inland",
    services: ["trucking", "drayage", "rail"], ownsEquipment: false, baseLocation: "Minneapolis, MN", cfsId: "cfs-3", rating: 4.1,
    contactEmail: "ops@midwestdray.com",
  },
  {
    id: "v-evans", name: "Evans Drayage (US Ports)", tier: 2, coast: "East",
    services: ["drayage", "trucking"], ownsEquipment: false, baseLocation: "Newark, NJ", cfsId: "cfs-9", rating: 4.0,
    contactEmail: "drayage@evanslogistics.com",
  },
  {
    id: "v-fumico", name: "FumiCo Pest & Treatment", tier: 2, coast: "East",
    services: ["fumigation", "certification"], ownsEquipment: false, baseLocation: "Savannah, GA", cfsId: "cfs-8", rating: 4.2,
    notes: "ISPM-15 / fumigation for AU & NZ lanes. No coverage on Egypt lane yet.", contactEmail: "service@fumico.com",
  },
  {
    id: "v-clearpath", name: "ClearPath Customs Brokers", tier: 1, coast: "Intl",
    services: ["customs"], ownsEquipment: false, baseLocation: "Houston, TX", rating: 4.6,
    contactEmail: "brokerage@clearpathcustoms.com",
  },
  {
    id: "v-caspian", name: "Caspian Forwarding (Poti)", tier: 3, coast: "Intl",
    services: ["trucking", "customs", "drayage"], ownsEquipment: false, baseLocation: "Poti, Georgia", rating: 3.8,
    notes: "Regional agent for Caucasus on-carriage (Poti → Baku).", contactEmail: "info@caspianfwd.ge",
  },
];

export function getVendor(id?: string): Vendor | undefined {
  return id ? VENDORS.find((v) => v.id === id) : undefined;
}

export function vendorsForService(service: string, coast?: string): Vendor[] {
  return VENDORS.filter(
    (v) => v.services.includes(service as Vendor["services"][number]) && (!coast || v.coast === coast),
  );
}

// Data sources — the four kinds: Shipping Line API, uploaded contract, custom request, Front import.
export const DATA_SOURCES: DataSource[] = [
  // Shipping line APIs
  { id: "ds-maersk-api", name: "Maersk Rates API", kind: "shipping_line_api", carrierId: "c-maersk", format: "API", status: "actual", validFrom: "2025-01-01", validTo: "2025-12-31", rateCount: 1840, lastSync: "2026-06-22T08:00:00Z" },
  { id: "ds-msc-api", name: "MyMSC Platform API", kind: "shipping_line_api", carrierId: "c-msc", format: "API", status: "actual", validFrom: "2025-01-01", validTo: "2025-12-31", rateCount: 1620, lastSync: "2026-06-22T08:10:00Z" },
  { id: "ds-cma-api", name: "CMA CGM Instant Quoting API", kind: "shipping_line_api", carrierId: "c-cma", format: "API", status: "actual", validFrom: "2025-04-01", validTo: "2025-09-30", rateCount: 980, lastSync: "2026-06-21T19:30:00Z" },
  { id: "ds-zim-api", name: "ZIM eZQuote API", kind: "shipping_line_api", carrierId: "c-zim", format: "API", status: "on_review", rateCount: 410, lastSync: "2026-06-20T11:00:00Z" },
  // Uploaded contracts
  { id: "ds-hapag-xls", name: "HAPAG-LLOYD SL Rates + D&D (hapag.xlsx)", kind: "uploaded_contract", carrierId: "c-hapag", format: "XLS", status: "actual", validFrom: "2025-01-01", validTo: "2025-09-30", rateCount: 640, description: "Container rates + Demurrage/Detention" },
  { id: "ds-yml-xls", name: "YML TPWB 940624 Atlantic Express AMD#3", kind: "uploaded_contract", carrierId: "c-yml", format: "XLS", status: "actual", validFrom: "2025-01-01", validTo: "2025-06-30", rateCount: 520, description: "Ocean Freight, Outport Arbitrary, Surcharges, D&D" },
  { id: "ds-kline-roro", name: "K-Line RoRo Contract (RORO168B AM31)", kind: "uploaded_contract", carrierId: "c-kline", format: "XLS", status: "actual", validFrom: "2024-07-01", validTo: "2024-12-31", rateCount: 88, description: "RoRo per-W/M contract — EXPIRED, still quotable" },
  { id: "ds-cma-surg", name: "CMA SURG.pdf (BAF schedule)", kind: "uploaded_contract", carrierId: "c-cma", format: "PDF", status: "actual", validFrom: "2025-06-01", validTo: "2025-08-31", description: "Floating BAF for US exports" },
  { id: "ds-zim-srg", name: "ZIM Srg.xls (surcharges by destination)", kind: "uploaded_contract", carrierId: "c-zim", format: "XLS", status: "on_review", description: "Destination surcharge schedule" },
  // Custom-requested rates
  { id: "ds-custom-jrl", name: "JRL custom loading quote — combine SP", kind: "custom_request", vendorId: "v-jrl", format: "Email", status: "actual", validTo: "2026-07-31", description: "Case-by-case loading quote for self-propelled combine" },
  { id: "ds-custom-caspian", name: "Caspian on-carriage quote (Poti→Baku)", kind: "custom_request", vendorId: "v-caspian", format: "Email", status: "additional", description: "Custom regional truck rate, AI-assisted RFQ" },
  // Front imports (await procurement review)
  { id: "ds-front-1", name: "Front: Höegh RoRo rate reply", kind: "front_import", carrierId: "c-hoegh", format: "Email", status: "on_review", rateCount: 12, description: "Inbound vendor email parsed by rate-ingestion microservice" },
];

export function getDataSource(id?: string): DataSource | undefined {
  return id ? DATA_SOURCES.find((d) => d.id === id) : undefined;
}

export function dataSourcesForVendor(vendorId: string): DataSource[] {
  return DATA_SOURCES.filter((d) => d.vendorId === vendorId);
}

export function dataSourcesForCarrier(carrierId: string): DataSource[] {
  return DATA_SOURCES.filter((d) => d.carrierId === carrierId);
}
