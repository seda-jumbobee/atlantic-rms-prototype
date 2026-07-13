import type { FrontRateRequest } from "@/lib/types";

// Rates that arrived through Front communications, parsed by the rate-ingestion
// microservice, awaiting Procurement Manager review before being added to RMS.
// `salesRequestedBy` = the sales who triggered the underlying RFQ (for dedup).
export const FRONT_RATE_REQUESTS: FrontRateRequest[] = [
  {
    id: "fr-1", receivedAt: "2026-06-21T09:10:00Z",
    fromEmail: "pricing.usa@hoegh.com", fromName: "Höegh Autoliners — US Pricing", carrierId: "c-hoegh",
    subject: "RE: RoRo rate request Baltimore → Zárate (combine, SP)",
    snippet: "Dear Atlantic team, please find our best RoRo rate for the self-propelled unit Baltimore → Zárate…",
    parsed: { lane: "Baltimore → Zárate", shipmentType: "RoRo", rate: 41.5, currency: "USD", validTo: "2026-09-30", surcharges: [{ code: "BAF", amount: 7.28 }, { code: "EU-ETS", amount: 1.49 }] },
    status: "new", confidence: 0.92, salesRequestedBy: "u-will",
  },
  {
    id: "fr-2", receivedAt: "2026-06-23T06:15:00Z",
    fromEmail: "ops@morriscargo.com", fromName: "Morris Cargo Handling", vendorId: "v-morris",
    subject: "Loading quote — Case IH 9240 on 40FR (Houston)",
    snippet: "Hi, our loading + lashing for the 9240 on a 40' flat rack at Houston is USD 4,650 incl. dunnage…",
    parsed: { lane: "Houston CFS", shipmentType: "Flatrack", container: "40FR", rate: 4650, currency: "USD", validTo: "2026-07-31" },
    status: "new", confidence: 0.88, salesRequestedBy: "u-vasily",
  },
  {
    id: "fr-3", receivedAt: "2026-06-22T18:50:00Z",
    fromEmail: "rates@cma-cgm.com", fromName: "CMA CGM eBusiness", carrierId: "c-cma",
    subject: "Updated BAF schedule — US exports Q3",
    snippet: "Please note the revised floating BAF applicable to US export shipments effective 01-Jul…",
    parsed: { lane: "US exports (all)", rate: 286, currency: "USD", validTo: "2026-08-31", surcharges: [{ code: "BAF", amount: 286 }] },
    status: "new", confidence: 0.95,
  },
  {
    id: "fr-4", receivedAt: "2026-06-22T15:05:00Z",
    fromEmail: "info@caspianfwd.ge", fromName: "Caspian Forwarding", vendorId: "v-caspian",
    subject: "On-carriage Poti → Baku (boom lift, oversize)",
    snippet: "Dear partner, for the oversize boom lift from Poti to Baku our all-in truck rate is USD 2,150…",
    parsed: { lane: "Poti → Baku", rate: 2150, currency: "USD", validTo: "2026-08-15" },
    status: "approved", confidence: 0.79, salesRequestedBy: "u-vitaly",
  },
  {
    // DUPLICATE of fr-1 (same lane + mode) requested by a different sales 2 days later, within the window
    id: "fr-5", receivedAt: "2026-06-23T11:20:00Z",
    fromEmail: "sales@hoegh.com", fromName: "Höegh Autoliners — Sales", carrierId: "c-hoegh",
    subject: "RoRo rate Baltimore → Zárate (self-propelled combine)",
    snippet: "Following your enquiry, our RoRo rate Baltimore → Zárate for the self-propelled combine is…",
    parsed: { lane: "Baltimore → Zárate", shipmentType: "RoRo", rate: 41.5, currency: "USD", validTo: "2026-09-30" },
    status: "new", confidence: 0.9, salesRequestedBy: "u-nick",
  },
  {
    // Same lane but > 30 days earlier → OUTSIDE the dedup window, so NOT flagged against fr-5
    id: "fr-6", receivedAt: "2026-04-16T10:00:00Z",
    fromEmail: "pricing.usa@hoegh.com", fromName: "Höegh Autoliners — US Pricing", carrierId: "c-hoegh",
    subject: "RoRo Baltimore → Zárate (Q2 indication)",
    snippet: "Q2 indication for RoRo Baltimore → Zárate…",
    parsed: { lane: "Baltimore → Zárate", shipmentType: "RoRo", rate: 39.0, currency: "USD", validTo: "2026-06-30" },
    status: "approved", confidence: 0.85, salesRequestedBy: "u-vasily",
  },
];

export function getFrontRequest(id?: string): FrontRateRequest | undefined {
  return id ? FRONT_RATE_REQUESTS.find((f) => f.id === id) : undefined;
}

// Duplicate-quote detection with a time limit so old requests aren't matched.
export const DEDUP_WINDOW_DAYS = 30;

function reqKey(r: FrontRateRequest): string {
  return `${(r.parsed.lane ?? "").toLowerCase().replace(/\s+/g, "")}|${r.parsed.shipmentType ?? ""}`.toLowerCase();
}

/** Earlier requests for the same lane+mode, by a different sales, within the dedup window. */
export function findFrontDuplicates(req: FrontRateRequest): FrontRateRequest[] {
  const t = new Date(req.receivedAt).getTime();
  const key = reqKey(req);
  return FRONT_RATE_REQUESTS.filter(
    (r) =>
      r.id !== req.id &&
      reqKey(r) === key &&
      new Date(r.receivedAt).getTime() < t &&
      t - new Date(r.receivedAt).getTime() <= DEDUP_WINDOW_DAYS * 86400000 &&
      r.salesRequestedBy !== req.salesRequestedBy,
  );
}
