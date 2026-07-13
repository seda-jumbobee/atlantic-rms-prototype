import type { Customer, Deal, DealStage, VendorInvoice } from "@/lib/types";

export const PIPELINE = "Atlantic Project Cargo";
export const DEAL_STAGES: DealStage[] = [
  "Incoming Lead",
  "Qualification",
  "Quote Sent",
  "Negotiation",
  "Confirmed (Won)",
  "Lost",
];
export const LEAD_SOURCES = [
  "Existing Customer",
  "Referred by a client",
  "Website form",
  "Google Ads",
  "JumboBee Marketplace",
  "Facebook",
];

export const CUSTOMERS: Customer[] = [
  { id: "cust-vanhang", company: "Guangzhou Vanhang Imton Supply Chain Co., Ltd", contact: "Fiona Chen", email: "kefu5@imton.cn", phone: "+86 20 5566 1234", country: "China", city: "Guangzhou", businessType: "Freight buyer", status: "Existing", responsibleId: "u-nick" },
  { id: "cust-friessen", company: "Friessen Logistics LLC", contact: "Ronny Friessen", email: "ronnyfriessen@icloud.com", phone: "+1 (620) 510-9190", country: "United States", city: "Hutchinson, KS", businessType: "Logistics", status: "Existing", responsibleId: "u-vasily" },
  { id: "cust-nileagri", company: "Nile Delta Agri Holding", contact: "Karim El-Sayed", email: "karim@niledelta-agri.com", phone: "+20 100 223 7788", country: "Egypt", city: "Cairo", businessType: "Equipment importer", status: "New", responsibleId: "u-nick" },
  { id: "cust-pampas", company: "Pampas Maquinaria S.A.", contact: "Diego Fernández", email: "diego@pampasmaq.com.ar", phone: "+54 11 4555 9090", country: "Argentina", city: "Buenos Aires", businessType: "Equipment dealer", status: "Existing", responsibleId: "u-will" },
  { id: "cust-caspianaz", company: "Caspian Energy Services", contact: "Elnur Mammadov", email: "e.mammadov@caspianenergy.az", phone: "+994 12 488 0011", country: "Azerbaijan", city: "Baku", businessType: "Oilfield services", status: "New", responsibleId: "u-vitaly" },
  { id: "cust-monarch", company: "Monarch Yachts", contact: "Denton D. Douglas", email: "denton@monarchyachts.com", phone: "+1 (561) 909-8811", country: "United States", city: "West Palm Beach, FL", businessType: "Ship builder", status: "Existing", responsibleId: "u-will" },
  { id: "cust-altona", company: "Altona Plant Hire Pty", contact: "Grace Whitfield", email: "grace@altonaplant.com.au", phone: "+61 3 9123 4567", country: "Australia", city: "Melbourne", businessType: "Equipment rental", status: "New", responsibleId: "u-vasily" },
];

export function getCustomer(id?: string): Customer | undefined {
  return id ? CUSTOMERS.find((c) => c.id === id) : undefined;
}

// Deals — the two real won deals + a realistic pipeline using the deal-ID grammar.
export const DEALS: Deal[] = [
  {
    id: "27598199",
    title: "Q3275 // 2017 JD 612C #1H00612CCGC795032 &612C 1H00612CTCC746067 &2012 John Deere 612C 1H00612CJCC746672",
    customerId: "cust-vanhang", managerId: "u-nick", stage: "Confirmed (Won)", pipeline: PIPELINE,
    leadSource: "Existing Customer", commodityType: "Agricultural Equipment",
    createdAt: "2026-06-19T10:04:44Z", lastModified: "2026-06-22T09:54:58Z", closedAt: undefined,
    sale: 14600, expenses: 11540, grossProfit: 3060, commissionPct: 15, margin: 2601, paymentReceived: true,
    bookingNo: "MAEU2261188", demsysNo: "DS-44021", referenceNo: "APC-Q3275",
    origin: "Charleston, IL", pol: "USHOU", pod: "CNSHA", destination: "Shanghai, China", shippingType: "Container (40HC)",
    quoteId: "Q-190612",
  },
  {
    id: "27566969",
    title: "WL264 // Houston - Arica 2023 John Deere S770 Combine SN-1H0S770SKP0825185",
    customerId: "cust-friessen", managerId: "u-vasily", stage: "Confirmed (Won)", pipeline: PIPELINE,
    leadSource: "Referred by a client", commodityType: "Agricultural Equipment",
    createdAt: "2026-06-18T09:19:59Z", lastModified: "2026-06-18T09:20:37Z",
    sale: 13600, expenses: 11255, grossProfit: 2345, commissionPct: 20, margin: 1876, paymentReceived: false,
    bookingNo: "MSCU8841020", demsysNo: "DS-44009", referenceNo: "APC-WL264",
    origin: "Hutchinson, KS", pol: "USHOU", pod: "CLARI", destination: "Arica, Chile", shippingType: "Flat Rack (40FR)",
    quoteId: "Q-190598",
  },
  {
    id: "27599410",
    title: "NK118 // Houston - Alexandria 2022 Hyster H50FT Forklift SN-K005V03821X",
    customerId: "cust-nileagri", managerId: "u-nick", stage: "Quote Sent", pipeline: PIPELINE,
    leadSource: "Website form", commodityType: "Material Handling",
    createdAt: "2026-06-21T14:22:10Z", lastModified: "2026-06-22T16:05:00Z",
    sale: 6200, expenses: 4980, grossProfit: 1220, commissionPct: 15,
    pol: "USHOU", pod: "EGALY", destination: "Alexandria, Egypt", shippingType: "Container (20DC)",
    quoteId: "Q-190644",
  },
  {
    id: "27599550",
    title: "WL271 // Baltimore - Zarate 2019 Komatsu PC210 Excavator SN-KMTPC210J6789012",
    customerId: "cust-pampas", managerId: "u-will", stage: "Negotiation", pipeline: PIPELINE,
    leadSource: "Referred by a client", commodityType: "Construction Equipment",
    createdAt: "2026-06-20T08:11:00Z", lastModified: "2026-06-23T07:40:00Z",
    sale: 9400, expenses: 7850, grossProfit: 1550, commissionPct: 18,
    pol: "USBAL", pod: "ARZAE", destination: "Zárate, Argentina", shippingType: "RoRo",
    quoteId: "Q-190651",
  },
  {
    id: "27599661",
    title: "VR084 // Poti - Baku 2021 JLG 1250AJP Boom Lift SN-0300256781",
    customerId: "cust-caspianaz", managerId: "u-vitaly", stage: "Qualification", pipeline: PIPELINE,
    leadSource: "Google Ads", commodityType: "Construction Equipment",
    createdAt: "2026-06-22T11:30:00Z", lastModified: "2026-06-23T09:10:00Z",
    destination: "Baku, Azerbaijan", shippingType: "RoRo + on-carriage",
  },
  {
    id: "27599702",
    title: "VL279 // Savannah - Melbourne 2020 Case IH 9240 Combine SN-YJG241188",
    customerId: "cust-altona", managerId: "u-vasily", stage: "Incoming Lead", pipeline: PIPELINE,
    leadSource: "JumboBee Marketplace", commodityType: "Agricultural Equipment",
    createdAt: "2026-06-23T06:02:00Z", lastModified: "2026-06-23T06:02:00Z",
    pol: "USSAV", pod: "AUMEL", destination: "Melbourne, Australia", shippingType: "Flat Rack (40FR)",
  },
  {
    id: "27598040",
    title: "WL259 // Miami - Southampton 2018 Sunseeker 76 Yacht SN-XSK760118",
    customerId: "cust-monarch", managerId: "u-will", stage: "Lost", pipeline: PIPELINE,
    leadSource: "Referred by a client", commodityType: "Boat / Yacht",
    createdAt: "2026-06-10T13:00:00Z", lastModified: "2026-06-17T10:00:00Z", closedAt: "2026-06-17T10:00:00Z",
    sale: 38000, expenses: 31000, grossProfit: 7000, destination: "Southampton, UK", shippingType: "RoRo / Break-bulk",
  },
];

export function getDeal(id?: string): Deal | undefined {
  return id ? DEALS.find((d) => d.id === id) : undefined;
}
export function dealsByStage(): Record<DealStage, Deal[]> {
  const out = {} as Record<DealStage, Deal[]>;
  for (const s of DEAL_STAGES) out[s] = DEALS.filter((d) => d.stage === s);
  return out;
}

// Vendor invoices for the quote-vs-invoice comparison (QuickBooks-style discrepancy detection).
export const VENDOR_INVOICES: VendorInvoice[] = [
  {
    id: "inv-wl264-jrl", dealId: "27566969", vendorId: "v-morris", reference: "APC-WL264", issuedAt: "2026-06-20T00:00:00Z",
    status: "discrepancy", qboRef: "QBO-BILL-4471", qboStatus: "synced", dueDate: "2026-07-05", paid: false,
    lines: [
      { legKind: "inland", description: "Inland trucking Hutchinson → Houston CFS", quoted: 2100, invoiced: 2380, vendorId: "v-rgntrans" },
      { legKind: "loading", description: "Loading & securing on 40FR", quoted: 4500, invoiced: 4500, vendorId: "v-morris" },
      { legKind: "drayage", description: "Drayage CFS → Houston port", quoted: 700, invoiced: 700, vendorId: "v-morris" },
    ],
  },
  {
    id: "inv-q3275-jrl", dealId: "27598199", vendorId: "v-jrl", reference: "APC-Q3275", issuedAt: "2026-06-21T00:00:00Z",
    status: "matched", qboRef: "QBO-BILL-4468", qboStatus: "synced", dueDate: "2026-07-06", paid: true,
    lines: [
      { legKind: "loading", description: "Loading 3× 612C corn heads (3/HC)", quoted: 2000, invoiced: 2000, vendorId: "v-jrl" },
      { legKind: "drayage", description: "Drayage to Houston port", quoted: 700, invoiced: 700, vendorId: "v-jrl" },
    ],
  },
  {
    id: "inv-q3275-cosco", dealId: "27598199", vendorId: "c-cosco", reference: "APC-Q3275-OF", issuedAt: "2026-06-21T00:00:00Z",
    status: "matched", qboRef: "QBO-BILL-4469", qboStatus: "synced", dueDate: "2026-07-10", paid: true,
    lines: [
      { legKind: "ocean", description: "Ocean freight 40HC Houston → Shanghai", quoted: 3850, invoiced: 3850 },
    ],
  },
  {
    id: "inv-nk118-morris", dealId: "27599410", vendorId: "v-morris", reference: "APC-NK118", issuedAt: "2026-06-22T00:00:00Z",
    status: "discrepancy", qboRef: "QBO-BILL-4480", qboStatus: "pending", dueDate: "2026-07-12", paid: false,
    lines: [
      { legKind: "loading", description: "Loading forklift in 20DC", quoted: 1000, invoiced: 1150, vendorId: "v-morris" },
      { legKind: "drayage", description: "Drayage Houston CFS → port", quoted: 700, invoiced: 700, vendorId: "v-morris" },
    ],
  },
  {
    id: "inv-wl271-evans", dealId: "27599550", vendorId: "v-evans", reference: "APC-WL271", issuedAt: "2026-06-23T00:00:00Z",
    status: "pending", qboRef: "—", qboStatus: "unmatched", dueDate: "2026-07-15", paid: false,
    lines: [
      { legKind: "drayage", description: "RoRo terminal drayage Baltimore", quoted: 650, invoiced: 0, vendorId: "v-evans" },
    ],
  },
];

export function dealForInvoice(inv: VendorInvoice): Deal | undefined {
  return getDeal(inv.dealId);
}
export function invoiceTotals(inv: VendorInvoice) {
  const quoted = inv.lines.reduce((s, l) => s + l.quoted, 0);
  const invoiced = inv.lines.reduce((s, l) => s + l.invoiced, 0);
  return { quoted, invoiced, variance: invoiced - quoted };
}

export function getInvoicesForDeal(dealId: string): VendorInvoice[] {
  return VENDOR_INVOICES.filter((v) => v.dealId === dealId);
}
