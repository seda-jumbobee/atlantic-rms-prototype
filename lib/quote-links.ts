import type { QuoteHistoryItem, CalcHistoryItem } from "@/lib/data/history";
import type { ShipmentType } from "@/lib/types";
import { CALCULATORS } from "@/lib/data/calculators";
import { encodeSearch } from "@/lib/search-params";

// Resolve a history lane back into Quote Master search params so a saved quote can be reopened & edited.
const PORT_BY_CITY: Record<string, string> = {
  Shanghai: "p-cnsha", Arica: "p-clari", Alexandria: "p-egaly", "Zárate": "p-arzae",
  Melbourne: "p-aumel", Southampton: "p-gbsou", Genoa: "p-itgoa", "Jebel Ali": "p-aedxb", Aqaba: "p-joaqj",
  Houston: "p-ushou", Baltimore: "p-usbal", Savannah: "p-ussav", Miami: "p-usjax",
  "Fort Lauderdale": "p-usjax", Amarillo: "p-ushou", Charleston: "p-ushou", Hutchinson: "p-ushou",
};

function resolvePort(loc: string): string | undefined {
  return PORT_BY_CITY[loc.split(",")[0].trim()];
}

function shipmentFromLabel(s: string): ShipmentType {
  const l = s.toLowerCase();
  if (l.includes("roro")) return "RoRo";
  if (l.includes("flat")) return "Flatrack";
  if (l.includes("reefer")) return "Reefer";
  if (l.includes("break")) return "Breakbulk";
  if (l.includes("lcl")) return "LCL";
  if (l.includes("air")) return "Air";
  return "Container";
}

function quoteSearchQs(q: QuoteHistoryItem): string | null {
  const op = resolvePort(q.origin), dp = resolvePort(q.destination);
  if (!op || !dp) return null;
  return encodeSearch({
    originPortId: op, destPortId: dp,
    commodityKind: q.commodityKind, commodityLabel: q.commodity,
    shipmentType: shipmentFromLabel(q.shipmentType), advancedSearch: false,
  });
}

/** Deep link that reopens a saved quote in the Quote Master flow for editing.
    NOTE: the mock data stores no rate/pricing snapshot, so this PREFILLS the
    flow from the saved lane/commodity rather than restoring an exact snapshot. */
export function reopenHref(q: QuoteHistoryItem): string {
  const qs = quoteSearchQs(q);
  return qs ? `/quote-master?${qs}&edit=1` : "/quote-master";
}

/** Start a NEW quote prefilled from a historical one (duplicate) — lands on the
    rate list without auto-selecting a rate; the original record is untouched. */
export function duplicateHref(q: QuoteHistoryItem): string {
  const qs = quoteSearchQs(q);
  return qs ? `/quote-master?${qs}` : "/quote-master";
}

/** Link to the calculator a history run was made with (inputs are not persisted in mock data). */
export function calculatorHref(c: CalcHistoryItem): string {
  const meta = CALCULATORS.find(
    (m) => m.name === c.calculator || m.name.startsWith(c.calculator) || c.calculator.startsWith(m.name)
  );
  return meta ? `/calculators/${meta.id}` : "/calculators";
}

/** "Needs attention" predicate — only states the mock data actually supports:
    drafts (never sent), expired quotes, and sent quotes with no response for 7+ days. */
export function needsAttention(q: QuoteHistoryItem, now = Date.now()): boolean {
  if (q.status === "draft" || q.status === "expired") return true;
  if (q.status === "sent") {
    const ageDays = (now - new Date(q.createdAt).getTime()) / 86_400_000;
    return ageDays >= 7;
  }
  return false;
}
