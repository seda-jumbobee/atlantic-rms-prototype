import type {
  RateOption,
  QuoteLeg,
  ChargeLine,
  ShipmentType,
  ContainerCode,
  CommodityKind,
  RouteRequirement,
  Dimensions,
} from "@/lib/types";
import { CARRIERS, getCarrier } from "@/lib/data/carriers";
import { getPort, getAddress, REQUIREMENTS } from "@/lib/data/ports";
import { getCfs, CFS_FACILITIES, getTruckingType } from "@/lib/data/cfs";
import { getEquipment } from "@/lib/data/equipment";
import { seeded, daysFromNow, VESSELS } from "@/lib/format";

export interface SearchInput {
  originPortId?: string;
  originAddressId?: string;
  destPortId?: string;
  destAddressId?: string;
  equipmentId?: string;
  commodityKind: CommodityKind;
  commodityLabel: string;
  shipmentType: ShipmentType;
  container?: ContainerCode;
  advancedSearch: boolean;
  loadingDate?: string;
  /* Display-only round-trip fields (not used by pricing) — preserve manually
     entered values when the search form is reopened for editing. */
  condition?: "operable" | "inoperable";
  dimensions?: Dimensions;
}

export function chargeTotal(c: ChargeLine): number {
  return c.qty * c.unitCost;
}
export function legTotal(leg: QuoteLeg): number {
  if (!leg.included) return 0;
  return leg.charges.reduce((s, c) => s + chargeTotal(c), 0);
}
export function rateTotal(r: RateOption): number {
  return r.legs.reduce((s, l) => s + legTotal(l), 0);
}

let idc = 0;
const cid = (p: string) => `${p}-${++idc}`;

// Deterministic APC contract reference per carrier offer (e.g. AEC-MAERSK-25732AMD002).
function contractNoFor(carrierCode: string, seed: string): string {
  const n = 100 + Math.floor(seeded(seed + "cn") * 900);
  const amd = Math.floor(seeded(seed + "amd") * 4);
  return `AEC-${carrierCode}-25${String(n).padStart(3, "0")}${amd > 0 ? `AMD00${amd}` : ""}`;
}

function charge(code: string, name: string, basis: ChargeLine["basis"], unitCost: number, qty = 1): ChargeLine {
  return { id: cid("ch"), code, name, basis, qty, currency: "USD", unitCost };
}

// Resolve origin/destination labels + whether each end is a door (address) or port.
function resolveEnds(input: SearchInput) {
  const oPort = getPort(input.originPortId);
  const oAddr = getAddress(input.originAddressId);
  const dPort = getPort(input.destPortId);
  const dAddr = getAddress(input.destAddressId);
  return {
    originLabel: oAddr?.label ?? (oPort ? `${oPort.name}, ${oPort.country}` : "Origin"),
    destLabel: dAddr?.label ?? (dPort ? `${dPort.name}, ${dPort.country}` : "Destination"),
    originIsDoor: !!oAddr,
    destIsDoor: !!dAddr,
    oPort, oAddr, dPort, dAddr,
  };
}

export function destinationRequirements(input: SearchInput): RouteRequirement[] {
  const dPort = getPort(input.destPortId);
  const reqs = [...(dPort?.requirements ?? [])];
  // Flat-rack / OOG cargo on ocean → NCB inspection
  if ((input.shipmentType === "Flatrack" || input.container === "40FR") && !reqs.find((r) => r.code === "NCB")) {
    reqs.push(REQUIREMENTS.NCB);
  }
  return reqs;
}

// Build the leg skeleton (TRUCKING → LOADING → DRAYAGE → OCEAN → ON-CARRIAGE) for one carrier offer.
function buildLegs(input: SearchInput, carrierId: string, seedBase: string): QuoteLeg[] {
  const { originLabel, destLabel, originIsDoor, destIsDoor, dPort } = resolveEnds(input);
  const eq = getEquipment(input.equipmentId);
  const legs: QuoteLeg[] = [];

  // pick a CFS near origin (Houston as default Gulf hub for the demo)
  const cfs = getCfs("cfs-6") ?? CFS_FACILITIES[0];

  // 1) Inland trucking (door → CFS)
  if (originIsDoor) {
    const tt = getTruckingType(eq?.truckingType ?? 14);
    const miles = 180 + Math.round(seeded(seedBase + "mi") * 520);
    const cost = Math.round((tt?.ratePerMile ?? 3) * miles);
    legs.push({
      id: cid("leg"), kind: "inland", title: "Inland Trucking", mode: "Truck",
      from: originLabel, to: `${cfs.name} CFS`, vendorId: "v-rgntrans", included: true,
      charges: [charge("IHE", `Trucking ${miles} mi · ${tt?.trailer ?? "Step Deck"}`, "Mile", cost)],
    });
  }

  // 2) Loading / warehouse handling (CFS)
  if (originIsDoor || input.shipmentType !== "RoRo") {
    const loadCost = input.shipmentType === "Flatrack" || input.container === "40FR" ? 4500 : 2500;
    legs.push({
      id: cid("leg"), kind: "loading", title: "Loading / Warehouse Handling", mode: "Handling",
      from: `${cfs.name} CFS`, to: `${cfs.name} CFS`, vendorId: "v-morris", included: true,
      charges: [
        charge("LOAD", "Loading & securing on flat rack", "Container", loadCost),
        charge("LAS", "Lashing & dunnage", "Container", 220),
      ],
    });
  }

  // 3) Container drayage (CFS → port) — not for RoRo / Breakbulk (no container)
  if (input.shipmentType !== "RoRo" && input.shipmentType !== "Breakbulk") {
    legs.push({
      id: cid("leg"), kind: "drayage", title: "Container Drayage", mode: "Truck",
      from: `${cfs.name} CFS`, to: `${cfs.nearestRampPort} Port`, vendorId: "v-morris", included: true,
      charges: [charge("DRAY", `Drayage ${cfs.name} → port`, "Container", cfs.drayageUsd)],
    });
  }

  // 4) Ocean freight + surcharges (the main sea leg)
  const baseBands: Record<string, [number, number]> = {
    Container: [2400, 4800],
    Flatrack: [6000, 9800],
    RoRo: [2600, 4200],
    Breakbulk: [5000, 12000],
    Reefer: [3200, 6000],
    LCL: [600, 1500],
    Air: [9000, 16000],
  };
  const [lo, hi] = baseBands[input.shipmentType] ?? [2400, 4800];
  const base = Math.round(lo + seeded(seedBase + "oc") * (hi - lo));
  const transit = 18 + Math.round(seeded(seedBase + "tt") * 40);
  const oceanCharges: ChargeLine[] = [
    charge("BAS", "Basic Ocean Freight", "Container", base),
    charge("BAF", "Bunker Adjustment Factor", "Container", Math.round(base * 0.06)),
    charge("THC", "Terminal Handling Charge", "Container", 250),
    charge("ECA", "Emission Control Areas", "Container", 15),
    charge("ODF", "Documentation Fee — Origin", "Bill of Lading", 55),
  ];
  if (input.shipmentType === "Flatrack" || input.container === "40FR") {
    oceanCharges.push(charge("HHC", "Heavyweight Handling", "Container", 480));
    oceanCharges.push(charge("OOG", "Out-of-gauge surcharge", "Container", 650));
  }
  const via = seeded(seedBase + "via") > 0.7 ? (seeded(seedBase + "v2") > 0.5 ? "Algeciras" : "Tangier") : "Direct";
  legs.push({
    id: cid("leg"), kind: "ocean", title: "Ocean Freight", mode: "Ocean",
    from: input.originPortId ? originLabel : `${cfs.nearestRampPort} Port`,
    to: dPort ? `${dPort.name}, ${dPort.country}` : destLabel,
    toCountryCode: dPort?.countryCode,
    carrierId, included: true, charges: oceanCharges, via,
    vessel: VESSELS[Math.floor(seeded(seedBase + "vs") * VESSELS.length)],
    voyage: `${Math.floor(100 + seeded(seedBase + "vy") * 800)}${seeded(seedBase) > 0.5 ? "W" : "E"}`,
    sailingDate: input.loadingDate ?? daysFromNow(7 + Math.floor(seeded(seedBase + "sd") * 21)),
    transitDays: transit,
    freeDaysPol: 7 + Math.floor(seeded(seedBase + "fp") * 8),
    freeDaysPod: 5 + Math.floor(seeded(seedBase + "fd") * 8),
  });

  // 5) On-carriage (port → consignee door)
  if (destIsDoor) {
    legs.push({
      id: cid("leg"), kind: "oncarriage", title: "On-carriage (port → door)", mode: "Truck",
      from: dPort ? `${dPort.name} Port` : "Destination Port", to: destLabel,
      vendorId: "v-caspian", included: true,
      charges: [
        charge("DTHC", "Destination Terminal Handling", "Container", 320),
        charge("DEL", "Final delivery", "Container", 780),
      ],
    });
  }

  return legs;
}

// Build a ranked set of carrier rate options for a search.
export function buildRateOptions(input: SearchInput): RateOption[] {
  // Which carriers participate (advanced search widens to spot/API sources)
  const roro = ["c-kline", "c-nyk", "c-hoegh"];
  let pool = CARRIERS.filter((c) => !["c-qatar"].includes(c.id));
  if (input.shipmentType === "RoRo") pool = CARRIERS.filter((c) => roro.includes(c.id));
  else if (input.shipmentType === "Breakbulk") pool = CARRIERS.filter((c) => [...roro, "c-hapag", "c-msc"].includes(c.id));
  else if (input.shipmentType === "Air") pool = CARRIERS.filter((c) => c.id === "c-qatar");
  else pool = pool.filter((c) => !roro.includes(c.id)); // Container / Flatrack / Reefer / LCL

  const count = input.advancedSearch ? Math.min(pool.length, 8) : Math.min(pool.length, 5);
  const lane = `${input.originPortId ?? input.originAddressId}-${input.destPortId ?? input.destAddressId}-${input.container ?? input.shipmentType}`;

  const sourceTypes: RateOption["sourceType"][] = input.advancedSearch
    ? ["Spot", "Carrier Haulage Spot", "Contract", "Offline Tariff"]
    : ["Contract", "Offline Tariff"];

  const options = pool.slice(0, count).map((carrier, i): RateOption => {
    const seedBase = `${lane}-${carrier.id}`;
    const legs = buildLegs(input, carrier.id, seedBase);
    const sourceType = sourceTypes[i % sourceTypes.length];
    const ocean = legs.find((l) => l.kind === "ocean")!;
    // expired example for the K-Line RoRo contract
    const expired = carrier.id === "c-kline" && input.shipmentType === "RoRo";
    const r: RateOption = {
      id: `r-${carrier.id}-${i}`,
      carrierId: carrier.id,
      dataSourceId:
        sourceType === "Spot" ? "ds-msc-api" : carrier.id === "c-hapag" ? "ds-hapag-xls" : "ds-maersk-api",
      contractNo: sourceType === "Spot" ? undefined : contractNoFor(carrier.code, seedBase),
      sourceType,
      shipmentType: input.shipmentType,
      legs,
      total: 0,
      currency: "USD",
      validFrom: daysFromNow(-30),
      validTo: expired ? "2024-12-31" : daysFromNow(120),
      expired,
      transitDays: ocean.transitDays ?? 30,
      sailingDate: ocean.sailingDate,
      vessel: ocean.vessel,
      via: ocean.via,
    };
    r.total = rateTotal(r);
    return r;
  });

  // sort by total ascending, mark the cheapest non-expired as recommended
  options.sort((a, b) => a.total - b.total);
  const firstValid = options.find((o) => !o.expired);
  if (firstValid) firstValid.recommended = true;
  return options;
}

export function carrierName(id: string): string {
  return getCarrier(id)?.name ?? id;
}
