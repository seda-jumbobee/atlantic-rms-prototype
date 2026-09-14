// Log of requests hitting the single RMS rate service across ALL surfaces —
// not just manager UI, but the public JumboBee calculator, client-facing website
// calculators, and programmatic API / CLI / MCP callers.

export type RequestChannel =
  | "manager_ui" // internal RMS web app
  | "jumbobee_public" // JumboBee marketplace public calculator
  | "website_calc" // atlanticprojectcargo.com client-facing calculators
  | "api" // REST API (3rd-party / partner)
  | "cli" // rms CLI
  | "mcp"; // MCP tool call (AI agents)

export interface RmsRequest {
  id: string;
  at: string; // ISO
  channel: RequestChannel;
  endpoint: string; // logical operation / route
  method: "GET" | "POST";
  lane?: string;
  commodity?: string;
  status: number; // HTTP-style
  latencyMs: number;
  resultTotal?: number; // quoted total if a quote was produced
  caller: string; // user email / "anonymous" / api key / agent
}

export const CHANNEL_META: Record<RequestChannel, { label: string; blurb: string; tone: string }> = {
  manager_ui: { label: "Manager UI", blurb: "Internal RMS web app", tone: "bg-blue-100 text-blue-700" },
  jumbobee_public: { label: "JumboBee Public", blurb: "JB marketplace calculator", tone: "bg-amber-100 text-amber-700" },
  website_calc: { label: "Website Calc", blurb: "Client-facing site calculators", tone: "bg-emerald-100 text-emerald-700" },
  api: { label: "API", blurb: "Partner / 3rd-party REST", tone: "bg-violet-100 text-violet-700" },
  cli: { label: "CLI", blurb: "rms command line", tone: "bg-slate-200 text-slate-700" },
  mcp: { label: "MCP", blurb: "AI agent tool call", tone: "bg-fuchsia-100 text-fuchsia-700" },
};

export const RMS_REQUESTS: RmsRequest[] = [
  { id: "req-1042", at: "2026-06-23T11:58:12Z", channel: "jumbobee_public", endpoint: "POST /api/v1/quotes:estimate", method: "POST", lane: "Houston → Alexandria", commodity: "Hyster H50FT Forklift", status: 200, latencyMs: 248, resultTotal: 6642, caller: "anonymous (jb-web)" },
  { id: "req-1041", at: "2026-06-23T11:55:03Z", channel: "website_calc", endpoint: "POST /api/v1/calc/roro", method: "POST", lane: "Baltimore → Bremerhaven", commodity: "Agri equipment (SP)", status: 200, latencyMs: 96, resultTotal: 2894, caller: "anonymous (apc-web)" },
  { id: "req-1040", at: "2026-06-23T11:52:41Z", channel: "manager_ui", endpoint: "POST /api/v1/quotes:search", method: "POST", lane: "Savannah → Melbourne", commodity: "Case IH 9240 Combine", status: 200, latencyMs: 312, resultTotal: 11200, caller: "vasily@atlanticprojectcargo.com" },
  { id: "req-1039", at: "2026-06-23T11:49:20Z", channel: "mcp", endpoint: "tool: rms.build_quote", method: "POST", lane: "Poti → Baku", commodity: "JLG 1250AJP Boom Lift", status: 200, latencyMs: 1840, resultTotal: 2150, caller: "agent:procurement-rfq" },
  { id: "req-1038", at: "2026-06-23T11:44:58Z", channel: "api", endpoint: "GET /api/v1/rates?lane=USHOU-EGALY", method: "GET", lane: "Houston → Alexandria", status: 200, latencyMs: 64, caller: "key:partner_demsys" },
  { id: "req-1037", at: "2026-06-23T11:40:11Z", channel: "jumbobee_public", endpoint: "POST /api/v1/quotes:estimate", method: "POST", lane: "Los Angeles → Busan", commodity: "John Deere 5130M Tractor", status: 200, latencyMs: 271, resultTotal: 4180, caller: "anonymous (jb-web)" },
  { id: "req-1036", at: "2026-06-23T11:33:50Z", channel: "website_calc", endpoint: "POST /api/v1/calc/trucking", method: "POST", lane: "Fargo → Hankinson CFS", commodity: "Steiger 400 HD", status: 200, latencyMs: 41, resultTotal: 1260, caller: "anonymous (apc-web)" },
  { id: "req-1035", at: "2026-06-23T11:28:02Z", channel: "manager_ui", endpoint: "POST /api/v1/quotes:search", method: "POST", lane: "Baltimore → Zárate", commodity: "Komatsu PC210 Excavator", status: 200, latencyMs: 356, resultTotal: 9400, caller: "will@atlanticprojectcargo.com" },
  { id: "req-1034", at: "2026-06-23T11:19:44Z", channel: "jumbobee_public", endpoint: "POST /api/v1/quotes:estimate", method: "POST", lane: "Houston → Santos", commodity: "Boom lift (unknown model)", status: 422, latencyMs: 88, caller: "anonymous (jb-web)" },
  { id: "req-1033", at: "2026-06-23T11:12:31Z", channel: "cli", endpoint: "rms contracts ingest --carrier hapag", method: "POST", status: 200, latencyMs: 4120, caller: "max@atlanticprojectcargo.com" },
  { id: "req-1032", at: "2026-06-23T10:58:09Z", channel: "website_calc", endpoint: "POST /api/v1/calc/drayage", method: "POST", lane: "Newark CFS → port", status: 200, latencyMs: 38, resultTotal: 950, caller: "anonymous (apc-web)" },
  { id: "req-1031", at: "2026-06-23T10:51:22Z", channel: "api", endpoint: "GET /api/v1/equipment?make=John+Deere", method: "GET", status: 200, latencyMs: 52, caller: "key:partner_jumbobee" },
  { id: "req-1030", at: "2026-06-23T10:42:15Z", channel: "manager_ui", endpoint: "POST /api/v1/quotes:search", method: "POST", lane: "Charleston IL → Shanghai", commodity: "JD 612C Corn Heads", status: 200, latencyMs: 298, resultTotal: 14600, caller: "manager@jumbobee.com" },
  { id: "req-1029", at: "2026-06-23T10:30:51Z", channel: "jumbobee_public", endpoint: "POST /api/v1/quotes:estimate", method: "POST", lane: "Miami → Genoa", commodity: "Azimut 60 Yacht", status: 200, latencyMs: 410, resultTotal: 41200, caller: "anonymous (jb-web)" },
  { id: "req-1028", at: "2026-06-23T10:18:33Z", channel: "mcp", endpoint: "tool: rms.request_vendor_rate", method: "POST", lane: "Savannah → Melbourne", commodity: "Fumigation (ISPM-15)", status: 200, latencyMs: 2210, caller: "agent:procurement-rfq" },
  { id: "req-1027", at: "2026-06-23T09:59:48Z", channel: "website_calc", endpoint: "POST /api/v1/calc/cbm", method: "POST", status: 200, latencyMs: 22, caller: "anonymous (apc-web)" },
  { id: "req-1026", at: "2026-06-23T09:40:12Z", channel: "api", endpoint: "POST /api/v1/quotes", method: "POST", lane: "Houston → Aqaba", commodity: "Transformer 120t (OOG)", status: 200, latencyMs: 520, resultTotal: 86500, caller: "key:partner_demsys" },
  { id: "req-1025", at: "2026-06-23T09:21:05Z", channel: "jumbobee_public", endpoint: "POST /api/v1/quotes:estimate", method: "POST", lane: "Seattle → Singapore", commodity: "Genie Z-45 FE", status: 429, latencyMs: 12, caller: "anonymous (jb-web)" },
  { id: "req-1024", at: "2026-06-23T08:55:39Z", channel: "manager_ui", endpoint: "GET /api/v1/deals/27566969", method: "GET", status: 200, latencyMs: 47, caller: "vasily@atlanticprojectcargo.com" },
  { id: "req-1023", at: "2026-06-23T08:40:18Z", channel: "website_calc", endpoint: "POST /api/v1/quotes:estimate", method: "POST", lane: "Amarillo → Jebel Ali", commodity: "Live cattle (40 head)", status: 200, latencyMs: 305, resultTotal: 22600, caller: "anonymous (apc-web)" },
];

export function requestsByChannel(): Record<RequestChannel, number> {
  const out = {} as Record<RequestChannel, number>;
  (Object.keys(CHANNEL_META) as RequestChannel[]).forEach((c) => (out[c] = RMS_REQUESTS.filter((r) => r.channel === c).length));
  return out;
}
