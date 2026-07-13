// ─────────────────────────────────────────────────────────────────────────────
// Atlantic Project Cargo — RMS domain model
// Modeled on the "RMS Data System (Main Data)" 6-level board:
//   Commodity → Type of Shipping → Destinations → Container Type → Rates → Markup
// plus the Kommo CRM deal schema and the Wisor-style leg/charge breakdown.
// ─────────────────────────────────────────────────────────────────────────────

// ── Roles & users ────────────────────────────────────────────────────────────
export type Role = "manager" | "admin"; // admin = Procurement Manager

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  initials: string;
  avatarColor: string;
}

// ── Geography ────────────────────────────────────────────────────────────────
export type LocationKind = "port" | "address" | "ramp" | "airport" | "cfs";

export interface Port {
  id: string;
  /** UN/LOCODE, e.g. USHOU */
  locode: string;
  name: string; // city / port name
  country: string;
  countryCode: string; // ISO2
  lat: number;
  lng: number;
  active: boolean;
  /** Some ports only accept certain commodities; empty = all */
  allowedCommodities?: CommodityKind[];
  /** mandatory services / declarations triggered by this destination */
  requirements?: RouteRequirement[];
}

export interface AddressPoint {
  id: string;
  label: string; // full address
  city: string;
  state?: string;
  country: string;
  countryCode: string;
  zip?: string;
  lat: number;
  lng: number;
  nearestCfsId?: string;
  milesToCfs?: number;
}

// ── Carriers / shipping lines ────────────────────────────────────────────────
export interface Carrier {
  id: string;
  code: string; // e.g. MAERSK, MSC
  name: string; // full legal name
  /** brand color used to render the logo chip */
  color: string;
  /** monogram shown in the logo chip */
  monogram: string;
  /** NCB loading inspection offered? (only Hapag & Maersk in reality) */
  offersNcb?: boolean;
  hasApi?: boolean;
  portalUrl?: string;
}

// ── Vendors & data sources ───────────────────────────────────────────────────
export type VendorTier = 1 | 2 | 3;
export type Coast = "East" | "West" | "Gulf" | "Inland" | "Intl";

export type VendorServiceKind =
  | "trucking"
  | "rail"
  | "loading"
  | "disassembly"
  | "washing"
  | "fumigation"
  | "fastening"
  | "certification"
  | "tire_service"
  | "drayage"
  | "customs"
  | "ocean"
  | "warehouse"
  | "inspection"
  | "packing";

export interface Vendor {
  id: string;
  name: string;
  tier: VendorTier;
  coast: Coast;
  services: VendorServiceKind[];
  ownsEquipment: boolean; // 1st-class own a crane etc.
  baseLocation: string;
  cfsId?: string;
  rating: number; // 1-5
  notes?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export type DataSourceKind =
  | "shipping_line_api"
  | "uploaded_contract"
  | "custom_request"
  | "front_import";

export type DataSourceStatus = "actual" | "on_review" | "in_edits" | "additional" | "old";

export interface DataSource {
  id: string;
  name: string;
  kind: DataSourceKind;
  carrierId?: string;
  vendorId?: string;
  format?: "XLS" | "API" | "CSV" | "PDF" | "Email";
  status: DataSourceStatus;
  validFrom?: string;
  validTo?: string; // contract end date / validity expiry
  rateCount?: number;
  description?: string;
  lastSync?: string;
}

// ── Surcharges / charge glossary ─────────────────────────────────────────────
export type ChargeBasis =
  | "Container"
  | "Bill of Lading"
  | "Shipment"
  | "W/M"
  | "CBM"
  | "Unit"
  | "Mile"
  | "Flat";

export interface SurchargeCode {
  code: string;
  name: string;
  carrierId?: string; // glossary owner; undefined = generic
  applicable: boolean; // APC actually charges it
  basis: ChargeBasis;
  /** where in the journey it sits */
  leg: LegKind;
}

// ── Commodity ────────────────────────────────────────────────────────────────
export type CommodityKind =
  | "equipment" // machinery (containerized / flat rack / RoRo)
  | "vehicle" // cars, trucks, self-propelled (RoRo)
  | "boat" // yachts / boats (RoRo, breakbulk / lift-on-lift-off, flat rack)
  | "livestock" // animals (ventilated reefer container / livestock vessel)
  | "oog" // out-of-gauge / break-bulk project cargo
  | "bulk" // dry/liquid bulk
  | "parcel"; // boxes & pallets (LCL / air)

export interface Dimensions {
  lengthIn: number; // inches
  widthIn: number;
  heightIn: number;
  weightLb: number;
  cbm?: number;
}

export interface EquipmentModel {
  id: string;
  industry: string; // Farm | Construction | ...
  productType: string; // Tractors | Combines | Headers | Boom Lift ...
  category: string;
  type: string;
  make: string;
  model: string;
  dimensions: Dimensions;
  /** master keys that drive the calculation */
  truckingType: number;
  oceanType: number;
  /** recommended container; RORO = no container */
  container: ContainerCode;
  loadingNotes?: string;
  /** units that fit per container (e.g. 2 draper headers per 40HC) */
  unitsPerContainer?: number;
}

// ── Containers / shipping types ──────────────────────────────────────────────
export type ContainerCode =
  | "20DC"
  | "40DC"
  | "40HC"
  | "45HC"
  | "20FR"
  | "40FR"
  | "20OT"
  | "40OT"
  | "20RF"
  | "40RF"
  | "RORO";

export interface ContainerSpec {
  code: ContainerCode;
  label: string;
  oneCode?: string; // ONE carrier code, e.g. D2/D4/F4
  grossKg: number;
  tareKg: number;
  payloadKg: number;
  intLengthM: number;
  intWidthM: number;
  intHeightM: number;
  capacityCbm: number;
}

export type ShipmentType =
  | "Container"
  | "Flatrack"
  | "RoRo"
  | "Breakbulk"
  | "Reefer"
  | "LCL"
  | "Air";
export type ShippingMode = "Ocean" | "Ground" | "Air";

// ── CFS / facilities / trucking ──────────────────────────────────────────────
export interface CfsFacility {
  id: string;
  name: string;
  city: string;
  state: string;
  zip?: string;
  drayageUsd: number;
  nearestRampPort: string;
  servesAll: boolean;
  servedOceanTypes?: number[];
  lat: number;
  lng: number;
}

export interface TruckingType {
  type: number;
  dimensions: string;
  weightBand: string;
  trailer: string;
  axles: string;
  ratePerMile: number;
}

// ── Quote legs / stages ──────────────────────────────────────────────────────
// canonical stage taxonomy from the "Calculations Structure" sheet
export type LegKind =
  | "preparation" // cargo inspection, liens, customs docs, insurance
  | "inland" // trucking OR railway pre-carriage (origin → CFS)
  | "loading" // loading / disassembly / fastening
  | "cfs" // container freight station handling / stuffing
  | "drayage" // CFS → port
  | "ocean" // main sea leg + surcharges
  | "oncarriage"; // destination port → consignee

export interface ChargeLine {
  id: string;
  code?: string; // surcharge code (THC, BAF, OCEAN…)
  name: string;
  basis: ChargeBasis;
  qty: number;
  currency: string;
  unitCost: number; // buy / net cost (RMS = expenses only)
  unitSell?: number; // manager-set sell (margin layer)
  comment?: string;
}

export interface QuoteLeg {
  id: string;
  kind: LegKind;
  title: string;
  mode?: "Truck" | "Rail" | "Ocean" | "Air" | "Handling";
  from: string;
  to: string;
  vendorId?: string;
  carrierId?: string;
  dataSourceId?: string;
  included: boolean;
  charges: ChargeLine[];
  /** schedule / transit info for ocean legs */
  vessel?: string;
  voyage?: string;
  via?: string;
  sailingDate?: string;
  transitDays?: number;
  freeDaysPol?: number;
  freeDaysPod?: number;
  /** flag: needed but no vendor → must request quote */
  needsQuote?: boolean;
  requirementCode?: string;
}

// ── Rates (search results) ───────────────────────────────────────────────────
export interface RateOption {
  id: string;
  carrierId: string;
  dataSourceId: string;
  contractNo?: string;
  sourceType: "Offline Tariff" | "Spot" | "Carrier Haulage Spot" | "Contract" | "Front Import";
  shipmentType: ShipmentType;
  legs: QuoteLeg[];
  total: number;
  currency: string;
  validFrom: string;
  validTo: string;
  expired: boolean;
  transitDays: number;
  sailingDate?: string;
  vessel?: string;
  via?: string;
  recommended?: boolean;
}

// ── Route requirements (auto-suggested mandatory services) ───────────────────
export interface RouteRequirement {
  code: string; // FUMIGATION | ACID | EORI | NCB ...
  label: string;
  reason: string;
  hasVendor: boolean; // if false → "Request quote with AI"
  estimatedCost?: number;
}

// ── Quote ────────────────────────────────────────────────────────────────────
export type QuoteStatus = "draft" | "sent" | "confirmed" | "lost" | "expired";

export interface QuoteRef {
  origin: string;
  destination: string;
  pol?: string;
  pod?: string;
  commodityLabel: string;
  commodityKind: CommodityKind;
  shipmentType: ShipmentType;
  container?: ContainerCode;
}

export interface Quote {
  id: string; // e.g. Q-190544
  ref: QuoteRef;
  status: QuoteStatus;
  createdAt: string;
  validFrom: string;
  validTo: string;
  customerId?: string;
  crmDealId?: string;
  managerId: string;
  selectedRateId?: string;
  legs: QuoteLeg[];
  /** margin layer — manager-set */
  marginAllIn?: number;
  marginPerLeg?: Record<string, number>;
  showLineNames: boolean; // include shipping line names in offer
  allInOnly: boolean; // hide itemized breakdown
  requirements: RouteRequirement[];
}

// ── CRM / deals / customers ──────────────────────────────────────────────────
export interface Customer {
  id: string;
  company: string;
  contact: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  businessType?: string;
  status: "Existing" | "New";
  responsibleId: string;
}

export type DealStage =
  | "Incoming Lead"
  | "Qualification"
  | "Quote Sent"
  | "Negotiation"
  | "Confirmed (Won)"
  | "Lost";

export interface Deal {
  id: string; // Kommo numeric id
  title: string; // structured deal-ID string (WL264 // ...)
  customerId: string;
  managerId: string;
  stage: DealStage;
  pipeline: string;
  leadSource: string;
  commodityType: string;
  createdAt: string;
  lastModified: string;
  closedAt?: string;
  // economics (admin/finance-sensitive)
  sale?: number; // sell price (manager-visible)
  expenses?: number; // cost (admin-only)
  grossProfit?: number; // admin-only
  commissionPct?: number;
  margin?: number; // admin-only
  paymentReceived?: boolean;
  bookingNo?: string;
  demsysNo?: string;
  referenceNo?: string;
  quoteId?: string;
  origin?: string;
  pol?: string;
  pod?: string;
  destination?: string;
  shippingType?: string;
}

// ── Invoice comparison (QuickBooks-style discrepancy detection) ──────────────
export interface InvoiceLine {
  legKind: LegKind;
  description: string;
  quoted: number;
  invoiced: number;
  vendorId?: string;
}

export interface VendorInvoice {
  id: string;
  dealId: string;
  vendorId: string;
  reference: string;
  issuedAt: string;
  lines: InvoiceLine[];
  status: "matched" | "discrepancy" | "pending";
  /** QuickBooks bill/reference linkage */
  qboRef?: string;
  qboStatus?: "synced" | "pending" | "unmatched";
  dueDate?: string;
  paid?: boolean;
}

// ── Front rate-review queue ──────────────────────────────────────────────────
export interface FrontRateRequest {
  id: string;
  receivedAt: string;
  fromEmail: string;
  fromName: string;
  carrierId?: string;
  vendorId?: string;
  subject: string;
  snippet: string;
  parsed: {
    lane?: string;
    shipmentType?: ShipmentType;
    container?: ContainerCode;
    rate?: number;
    currency?: string;
    validTo?: string;
    surcharges?: { code: string; amount: number }[];
  };
  status: "new" | "approved" | "rejected";
  confidence: number; // 0-1 AI parse confidence
  /** which sales triggered the underlying rate request (for duplicate detection) */
  salesRequestedBy?: string;
}

// ── AI quote request (RFQ to vendor) ─────────────────────────────────────────
export interface AiQuoteRequest {
  id: string;
  legKind: LegKind;
  requirementCode?: string;
  lane: string;
  vendorCandidates: string[]; // vendor ids / names
  draftMessage: string;
  status: "draft" | "sent" | "quoted";
  quotedAmount?: number;
}

// ── Calculators ──────────────────────────────────────────────────────────────
export type CalculatorId =
  | "shipping-lines"
  | "trucking"
  | "loading"
  | "roro"
  | "ocean-freight"
  | "drayage"
  | "oog"
  | "cbm"
  | "equipment-dims"
  | "air-freight"
  | "demurrage"
  | "insurance"
  | "customs";

export interface CalculatorMeta {
  id: CalculatorId;
  name: string;
  description: string;
  icon: string; // lucide icon name
  unit: string; // primary cost driver
  region?: string;
}

// ── Route builder ────────────────────────────────────────────────────────────
export type RouteStepKind =
  | "commodity"
  | "trucking"
  | "rail"
  | "disassembly"
  | "washing"
  | "loading"
  | "cfs_packing"
  | "drayage"
  | "ocean"
  | "oncarriage"
  | "custom"
  | "ai_vendor";

export interface RouteStep {
  id: string;
  kind: RouteStepKind;
  title: string;
  detail: string;
  location?: string;
  toLocation?: string;
  vendorId?: string;
  carrierId?: string;
  dataSourceId?: string;
  cost: number;
  durationDays: number;
  status: "set" | "pending_ai" | "quoted";
  icon: string;
  /** itemized breakdown (e.g. ocean base + surcharges); cost derives from sum when present */
  charges?: ChargeLine[];
  vessel?: string;
  sailingDate?: string;
  freeDaysPod?: number;
}
