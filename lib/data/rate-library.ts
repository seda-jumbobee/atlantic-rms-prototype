// Unified rate library — every rate row behind the quote engine, across all
// types, browsable & searchable in one place (admin). Each row carries its
// data source so it links back to a contract/API/Front import for editing.

export type RateType = "ocean" | "roro" | "trucking" | "loading" | "drayage" | "surcharge";

export interface RateRow {
  id: string;
  type: RateType;
  origin?: string;
  destination?: string;
  carrierId?: string;
  vendorId?: string;
  container?: string;
  commodity?: string;
  rate: number;
  unit: string; // per container / per W/M / $/mile / flat / per unit
  currency: string;
  validFrom?: string;
  validTo?: string;
  dataSourceId: string;
  status: "actual" | "on_review" | "old";
}

export const RATE_TYPE_LABEL: Record<RateType, string> = {
  ocean: "Ocean Freight",
  roro: "RoRo",
  trucking: "Trucking (inland)",
  loading: "Loading / CFS",
  drayage: "Drayage",
  surcharge: "Surcharge",
};

export const RATE_LIBRARY: RateRow[] = [
  // Ocean (OPS-style, flat rack / dry)
  { id: "rl-1", type: "ocean", origin: "USHOU", destination: "AUBNE", carrierId: "c-oocl", container: "40FR", rate: 9324, unit: "per container", currency: "USD", validFrom: "2025-01-01", validTo: "2026-06-30", dataSourceId: "ds-maersk-api", status: "actual" },
  { id: "rl-2", type: "ocean", origin: "USHOU", destination: "EGALY", carrierId: "c-msc", container: "40HC", rate: 3230, unit: "per container", currency: "USD", validFrom: "2025-01-01", validTo: "2025-12-31", dataSourceId: "ds-msc-api", status: "actual" },
  { id: "rl-3", type: "ocean", origin: "USSAV", destination: "AUMEL", carrierId: "c-hapag", container: "40FR", rate: 9870, unit: "per container", currency: "USD", validFrom: "2025-01-01", validTo: "2025-09-30", dataSourceId: "ds-hapag-xls", status: "actual" },
  { id: "rl-4", type: "ocean", origin: "USBAL", destination: "DEBRV", carrierId: "c-cma", container: "40HC", rate: 2780, unit: "per container", currency: "USD", validFrom: "2025-04-01", validTo: "2025-09-30", dataSourceId: "ds-cma-api", status: "actual" },
  { id: "rl-5", type: "ocean", origin: "USNYC", destination: "CNSHA", carrierId: "c-cosco", container: "40HC", rate: 2540, unit: "per container", currency: "USD", validFrom: "2025-01-01", validTo: "2025-12-31", dataSourceId: "ds-maersk-api", status: "actual" },
  { id: "rl-6", type: "ocean", origin: "USLAX", destination: "KRPUS", carrierId: "c-one", container: "40HC", rate: 1980, unit: "per container", currency: "USD", validFrom: "2025-01-01", validTo: "2025-12-31", dataSourceId: "ds-maersk-api", status: "actual" },
  { id: "rl-7", type: "ocean", origin: "USSAV", destination: "EGDAM", carrierId: "c-yml", container: "40FR", rate: 7450, unit: "per container", currency: "USD", validFrom: "2025-01-01", validTo: "2025-06-30", dataSourceId: "ds-yml-xls", status: "old" },
  // RoRo (per W/M)
  { id: "rl-8", type: "roro", origin: "USBAL", destination: "DEBRV", carrierId: "c-kline", commodity: "Agri equipment (SP)", rate: 33.0, unit: "per W/M", currency: "USD", validFrom: "2024-07-01", validTo: "2024-12-31", dataSourceId: "ds-kline-roro", status: "old" },
  { id: "rl-9", type: "roro", origin: "USBAL", destination: "ARZAE", carrierId: "c-hoegh", commodity: "Combine (SP)", rate: 41.5, unit: "per W/M", currency: "USD", validFrom: "2026-01-01", validTo: "2026-09-30", dataSourceId: "ds-front-1", status: "on_review" },
  { id: "rl-10", type: "roro", origin: "USJAX", destination: "GBSOU", carrierId: "c-nyk", commodity: "Yacht ≤ 18m", rate: 56.7, unit: "per W/M", currency: "USD", validFrom: "2025-01-01", validTo: "2026-03-31", dataSourceId: "ds-kline-roro", status: "actual" },
  // Trucking ($/mile)
  { id: "rl-11", type: "trucking", vendorId: "v-rgntrans", commodity: "Type 5 — 144-156\" RGN", rate: 6.0, unit: "$/mile", currency: "USD", validTo: "2026-12-31", dataSourceId: "ds-custom-jrl", status: "actual" },
  { id: "rl-12", type: "trucking", vendorId: "v-midwestdray", commodity: "Type 1 — ≤102\" step deck", rate: 3.0, unit: "$/mile", currency: "USD", validTo: "2026-12-31", dataSourceId: "ds-custom-jrl", status: "actual" },
  { id: "rl-13", type: "trucking", vendorId: "v-rgntrans", commodity: "Type 23 — 90-115k lb", rate: 15.0, unit: "$/mile", currency: "USD", validTo: "2026-12-31", dataSourceId: "ds-custom-jrl", status: "actual" },
  // Loading / CFS
  { id: "rl-14", type: "loading", vendorId: "v-morris", container: "40FR", commodity: "All Purpose (flat rack)", rate: 4500, unit: "flat", currency: "USD", validTo: "2026-07-31", dataSourceId: "ds-custom-jrl", status: "actual" },
  { id: "rl-15", type: "loading", vendorId: "v-jrl", container: "40HC", commodity: "Corn Head ($130/row)", rate: 130, unit: "per row", currency: "USD", validTo: "2026-07-31", dataSourceId: "ds-custom-jrl", status: "actual" },
  { id: "rl-16", type: "loading", vendorId: "v-tro", container: "40HC", commodity: "Draper Header (2/HC)", rate: 2000, unit: "flat", currency: "USD", validTo: "2026-07-31", dataSourceId: "ds-custom-jrl", status: "actual" },
  // Drayage
  { id: "rl-17", type: "drayage", vendorId: "v-morris", origin: "Houston CFS", destination: "USHOU", rate: 700, unit: "per container", currency: "USD", validTo: "2026-12-31", dataSourceId: "ds-custom-jrl", status: "actual" },
  { id: "rl-18", type: "drayage", vendorId: "v-evans", origin: "Newark CFS", destination: "USNYC", rate: 700, unit: "per container", currency: "USD", validTo: "2026-12-31", dataSourceId: "ds-custom-jrl", status: "actual" },
  // Surcharges
  { id: "rl-19", type: "surcharge", carrierId: "c-cma", commodity: "BAF — US exports", rate: 286, unit: "per container", currency: "USD", validFrom: "2026-07-01", validTo: "2026-08-31", dataSourceId: "ds-cma-surg", status: "actual" },
  { id: "rl-20", type: "surcharge", carrierId: "c-msc", commodity: "EBS", rate: 200, unit: "per container", currency: "USD", validTo: "2026-12-31", dataSourceId: "ds-zim-srg", status: "on_review" },
  { id: "rl-21", type: "surcharge", carrierId: "c-kline", commodity: "BAF (RoRo) EURO→USGC", rate: 7.28, unit: "per W/M", currency: "USD", validTo: "2026-09-30", dataSourceId: "ds-front-1", status: "on_review" },
];

export function searchRates(query: string, type?: RateType): RateRow[] {
  const q = query.trim().toLowerCase();
  return RATE_LIBRARY.filter((r) => {
    if (type && r.type !== type) return false;
    if (!q) return true;
    return [r.origin, r.destination, r.commodity, r.container, r.carrierId, r.vendorId, r.unit]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });
}

export function ratesForDataSource(dataSourceId: string): RateRow[] {
  return RATE_LIBRARY.filter((r) => r.dataSourceId === dataSourceId);
}

export function ratesForVendor(vendorId: string): RateRow[] {
  return RATE_LIBRARY.filter((r) => r.vendorId === vendorId);
}
