import type { QuoteStatus, CommodityKind } from "@/lib/types";

// Which flow produced the quote — both flows create quotes and live under the
// History "Quotes" tab, distinguished by this type (never separate tabs).
export type QuoteHistoryType = "rate-quote" | "custom-route";

export interface QuoteHistoryItem {
  id: string;
  quoteType: QuoteHistoryType;
  commodity: string;
  commodityKind: CommodityKind;
  origin: string;
  destination: string;
  shipmentType: string;
  /** client-facing quoted total */
  total: number;
  status: QuoteStatus;
  managerId: string;
  createdAt: string;
  updatedAt: string;
  /** last time the quote was sent to the client (sent / won / lost records) */
  sentAt?: string;
  customer: string;
  dealId?: string;
}

export const QUOTE_HISTORY: QuoteHistoryItem[] = [
  { id: "Q-190612", quoteType: "rate-quote", commodity: "John Deere 612C Corn Heads (×3)", commodityKind: "equipment", origin: "Charleston, IL", destination: "Shanghai, China", shipmentType: "Container 40HC", total: 14600, status: "confirmed", managerId: "u-nick", createdAt: "2026-06-19T10:10:00Z", updatedAt: "2026-06-20T15:40:00Z", sentAt: "2026-06-19T16:05:00Z", customer: "Guangzhou Vanhang", dealId: "27598199" },
  { id: "Q-190598", quoteType: "rate-quote", commodity: "John Deere S770 Combine", commodityKind: "equipment", origin: "Houston, TX", destination: "Arica, Chile", shipmentType: "Flat Rack 40FR", total: 13600, status: "confirmed", managerId: "u-vasily", createdAt: "2026-06-18T09:25:00Z", updatedAt: "2026-06-19T11:00:00Z", sentAt: "2026-06-18T13:30:00Z", customer: "Friessen Logistics", dealId: "27566969" },
  { id: "Q-190644", quoteType: "rate-quote", commodity: "Hyster H50FT Forklift", commodityKind: "equipment", origin: "Houston, TX", destination: "Alexandria, Egypt", shipmentType: "Container 20DC", total: 6200, status: "sent", managerId: "u-nick", createdAt: "2026-06-21T14:30:00Z", updatedAt: "2026-06-21T15:05:00Z", sentAt: "2026-06-21T15:05:00Z", customer: "Nile Delta Agri" },
  { id: "Q-190651", quoteType: "custom-route", commodity: "Komatsu PC210 Excavator", commodityKind: "equipment", origin: "Baltimore, MD", destination: "Zárate, Argentina", shipmentType: "RoRo", total: 9400, status: "draft", managerId: "u-will", createdAt: "2026-06-20T08:20:00Z", updatedAt: "2026-06-22T09:45:00Z", customer: "Pampas Maquinaria" },
  { id: "Q-190640", quoteType: "rate-quote", commodity: "Case IH 9240 Combine", commodityKind: "equipment", origin: "Savannah, GA", destination: "Melbourne, Australia", shipmentType: "Flat Rack 40FR", total: 11200, status: "draft", managerId: "u-vasily", createdAt: "2026-06-23T06:10:00Z", updatedAt: "2026-06-23T06:10:00Z", customer: "Altona Plant Hire" },
  { id: "Q-190588", quoteType: "custom-route", commodity: "Sunseeker 76 Yacht", commodityKind: "boat", origin: "Miami, FL", destination: "Southampton, UK", shipmentType: "RoRo / Break-bulk", total: 38000, status: "lost", managerId: "u-will", createdAt: "2026-06-10T13:10:00Z", updatedAt: "2026-06-14T10:20:00Z", sentAt: "2026-06-11T09:00:00Z", customer: "Monarch Yachts", dealId: "27598040" },
  { id: "Q-190620", quoteType: "custom-route", commodity: "Azimut 60 Flybridge Yacht", commodityKind: "boat", origin: "Fort Lauderdale, FL", destination: "Genoa, Italy", shipmentType: "RoRo (lift-on/off)", total: 41200, status: "confirmed", managerId: "u-will", createdAt: "2026-06-16T11:00:00Z", updatedAt: "2026-06-17T14:30:00Z", sentAt: "2026-06-16T17:45:00Z", customer: "Monarch Yachts" },
  { id: "Q-190662", quoteType: "rate-quote", commodity: "Live breeding cattle — 40 head", commodityKind: "livestock", origin: "Amarillo, TX", destination: "Jebel Ali, UAE", shipmentType: "Reefer / livestock vessel", total: 22600, status: "sent", managerId: "u-vasily", createdAt: "2026-06-23T08:40:00Z", updatedAt: "2026-06-23T09:10:00Z", sentAt: "2026-06-23T09:10:00Z", customer: "Gulf Livestock Trading" },
  { id: "Q-190631", quoteType: "custom-route", commodity: "Project transformer 120t (OOG)", commodityKind: "oog", origin: "Houston, TX", destination: "Aqaba, Jordan", shipmentType: "Breakbulk", total: 86500, status: "draft", managerId: "u-nick", createdAt: "2026-06-21T10:15:00Z", updatedAt: "2026-06-22T16:20:00Z", customer: "Caspian Energy Services" },
];

export interface CalcHistoryItem {
  id: string;
  calculator: string;
  summary: string;
  result: number;
  unit?: string;
  managerId: string;
  createdAt: string;
  /** quote this calculation fed into, when it was run for one */
  relatedQuoteId?: string;
}

export const CALC_HISTORY: CalcHistoryItem[] = [
  { id: "C-5259025", calculator: "RoRo Calculator", summary: "Agri equipment SP · Baltimore → Bremerhaven · 40 CBM", result: 2893.6, managerId: "u-vasily", createdAt: "2026-06-22T15:00:00Z" },
  { id: "C-5259044", calculator: "US / Canada Trucking", summary: "Case IH Steiger 400 · Fargo → Hankinson CFS · 28 mi", result: 1260, unit: "Type 3 · $4.5/mi", managerId: "u-will", createdAt: "2026-06-22T11:20:00Z" },
  { id: "C-5259051", calculator: "Loading Calculator", summary: "Corn Head · 3 per 40HC · $130/row × 12", result: 1560, managerId: "u-nick", createdAt: "2026-06-21T17:45:00Z", relatedQuoteId: "Q-190612" },
  { id: "C-5259062", calculator: "Drayage Calculator", summary: "Houston CFS → port · 1 cntr", result: 700, managerId: "u-nick", createdAt: "2026-06-21T09:30:00Z", relatedQuoteId: "Q-190644" },
  { id: "C-5259070", calculator: "OOG / Lost-Slot", summary: "Over-width 0.6m left/right on 40' FR HC", result: 2, unit: "lost TEU", managerId: "u-max", createdAt: "2026-06-20T13:15:00Z" },
];

export function getQuoteHistoryItem(id?: string): QuoteHistoryItem | undefined {
  return id ? QUOTE_HISTORY.find((q) => q.id === id) : undefined;
}
