// Custom Route — stage status + rate-provenance derivation.
// Kept pure (no JSX) so both the stage card and the route-readiness panel derive
// the same state from the same fields. A stage is only "Confirmed" when it holds
// a firm rate (contract / API / AI-sourced quote), never a mere estimate.

import type { RouteStep } from "@/lib/types";
import type { StatusTone } from "@/components/status-badge";

export type StageStatus =
  | "draft"
  | "needs-rate"
  | "ai-sourcing"
  | "suggestion-ready"
  | "rate-selected"
  | "confirmed";

/** Transient AI-sourcing phase for a stage (not persisted). */
export type AiPhase = "idle" | "searching" | "suggestions" | "failed" | "empty";

export const STAGE_STATUS_META: Record<StageStatus, { label: string; tone: StatusTone; help: string }> = {
  draft: { label: "Draft", tone: "neutral", help: "Added, but no vendor or confirmed rate yet." },
  "needs-rate": { label: "Needs rate", tone: "warning", help: "This stage has no price yet — enter one or source it." },
  "ai-sourcing": { label: "AI sourcing", tone: "info", help: "Searching available sources for a vendor and rate." },
  "suggestion-ready": { label: "Suggestion ready", tone: "info", help: "AI found options — review and confirm one." },
  "rate-selected": { label: "Rate selected", tone: "neutral", help: "A rate is set. It may be manual or estimated — confirm to finalize." },
  confirmed: { label: "Confirmed", tone: "positive", help: "Firm rate from a contract, connected API, or a sourced quote." },
};

const FIRM: ReadonlyArray<NonNullable<RouteStep["provenance"]>> = ["contract", "api", "ai_quote"];

export function stageStatus(s: RouteStep, aiPhase: AiPhase = "idle"): StageStatus {
  if (aiPhase === "searching") return "ai-sourcing";
  if (aiPhase === "suggestions") return "suggestion-ready";
  const hasCost = (Number(s.cost) || 0) > 0;
  if (!hasCost) return "needs-rate";
  if (s.provenance && FIRM.includes(s.provenance) && !s.edited) return "confirmed";
  const hasVendor = !!(s.vendorId || s.carrierId);
  if (!hasVendor && !s.provenance) return "draft";
  return "rate-selected";
}

/** Statuses that block "Continue to pricing". */
export function isBlockingStatus(st: StageStatus): boolean {
  return st === "needs-rate" || st === "ai-sourcing" || st === "suggestion-ready";
}

// ── rate provenance (the source badge next to the selected rate) ──
export type Provenance = NonNullable<RouteStep["provenance"]>;

export const PROVENANCE_META: Record<Provenance, { label: string; tone: StatusTone; estimated?: boolean; ai?: boolean }> = {
  manual: { label: "Manual rate", tone: "neutral" },
  contract: { label: "Contract rate", tone: "positive" },
  api: { label: "API rate", tone: "positive" },
  ai_suggestion: { label: "AI suggestion", tone: "info", ai: true },
  ai_quote: { label: "AI-sourced quote", tone: "positive", ai: true },
  ai_estimate: { label: "AI estimate", tone: "warning", ai: true, estimated: true },
};

/** The badge shown for the selected rate, accounting for a later manual edit. */
export function provenanceBadge(s: RouteStep): { label: string; tone: StatusTone; ai: boolean; estimated: boolean } | null {
  if (!s.provenance) return null;
  const meta = PROVENANCE_META[s.provenance];
  if (s.edited && meta.ai) return { label: "AI-assisted · edited", tone: "neutral", ai: true, estimated: false };
  return { label: meta.label, tone: meta.tone, ai: !!meta.ai, estimated: !!meta.estimated };
}
