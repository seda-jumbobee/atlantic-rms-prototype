"use client";

import { Sparkles, Loader2, RefreshCw, Info, TriangleAlert, CheckCircle2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { CarrierLogo } from "@/components/carrier-logo";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { money, fmtDate, seeded, daysFromNow } from "@/lib/format";
import { getVendor } from "@/lib/data/vendors";
import { getCarrier } from "@/lib/data/carriers";
import { PROVENANCE_META, type AiPhase } from "@/components/route/route-status";
import type { RouteStep, Vendor } from "@/lib/types";

export interface AiSuggestion {
  id: string;
  /** Distinguishes a recommended existing rate, a freshly obtained quote, and a rough estimate. */
  type: "ai_suggestion" | "ai_quote" | "ai_estimate";
  vendorId?: string;
  carrierId?: string;
  cost: number;
  durationDays: number;
  /** Where the number came from (contract card, live quote, benchmark…). */
  sourceName: string;
  lastUpdated?: string;
  note?: string;
}

export interface AiState {
  phase: AiPhase;
  suggestions: AiSuggestion[];
}

export const IDLE_AI: AiState = { phase: "idle", suggestions: [] };

/** Deterministic candidate generation from real vendor data. No confidence values. */
export function generateSuggestions(step: RouteStep, vendors: Vendor[], baseCost: number, baseDays: number): AiSuggestion[] {
  if (step.kind === "custom") return []; // free-form step — nothing to source
  const r = seeded(step.id + step.kind);
  const base = baseCost > 0 ? baseCost : Math.round((800 + r * 2600) / 10) * 10;
  const days = baseDays > 0 ? baseDays : Math.max(1, Math.round(1 + r * 5));
  const out: AiSuggestion[] = [];
  const v0 = vendors[0];
  const v1 = vendors.find((v) => v.id !== v0?.id) ?? undefined;

  if (v0) {
    out.push({
      id: `${step.id}-ai-1`,
      type: "ai_suggestion",
      vendorId: v0.id,
      cost: Math.round((base * 0.96) / 10) * 10,
      durationDays: days,
      sourceName: `${v0.name} contract card`,
      lastUpdated: daysFromNow(-18),
      note: "Recommends an existing contract — verify it is still valid before quoting.",
    });
  }
  if (v1) {
    out.push({
      id: `${step.id}-ai-2`,
      type: "ai_quote",
      vendorId: v1.id,
      cost: Math.round((base * 1.02) / 10) * 10,
      durationDays: days + (r > 0.5 ? 1 : 0),
      sourceName: "Live quote request",
      lastUpdated: daysFromNow(0),
    });
  }
  // Always offer a benchmark estimate as a clearly-labelled fallback.
  out.push({
    id: `${step.id}-ai-3`,
    type: "ai_estimate",
    cost: Math.round(base / 10) * 10,
    durationDays: days,
    sourceName: "Lane benchmark",
    note: "Estimated from lane averages — not a confirmed rate.",
  });
  return out;
}

/** Patch to apply to the stage when a suggestion is accepted. */
export function suggestionPatch(s: AiSuggestion): Partial<RouteStep> {
  return {
    vendorId: s.vendorId,
    carrierId: s.carrierId,
    cost: s.cost,
    durationDays: s.durationDays,
    provenance: s.type,
    dataSourceId: undefined,
    charges: undefined,
    edited: false,
  };
}

function suggestionName(s: AiSuggestion): string {
  return getCarrier(s.carrierId)?.name ?? getVendor(s.vendorId)?.name ?? "Lane estimate";
}

function SuggestionCard({ s, onUse }: { s: AiSuggestion; onUse: () => void }) {
  const meta = PROVENANCE_META[s.type];
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {s.carrierId && <CarrierLogo carrierId={s.carrierId} size="sm" />}
            <span className="truncate font-medium">{suggestionName(s)}</span>
          </div>
          <StatusBadge tone={meta.tone} dot={false} className="mt-1">{meta.label}</StatusBadge>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-caption uppercase tracking-wide text-muted-foreground">Internal cost</div>
          <div className="font-bold tabular-nums">{money(s.cost)}</div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="flex items-center justify-between gap-2"><dt className="text-muted-foreground">Duration</dt><dd className="font-medium">{s.durationDays} days</dd></div>
        <div className="flex items-center justify-between gap-2"><dt className="text-muted-foreground">Source</dt><dd className="min-w-0 truncate font-medium">{s.sourceName}</dd></div>
        {s.lastUpdated && <div className="flex items-center justify-between gap-2"><dt className="text-muted-foreground">Updated</dt><dd className="font-medium">{fmtDate(s.lastUpdated)}</dd></div>}
      </dl>

      {s.note && (
        <p className={`flex items-start gap-1.5 rounded-md p-2 text-caption ${meta.estimated ? "bg-status-warning-bg text-status-warning-fg" : "bg-muted/60 text-muted-foreground"}`}>
          {meta.estimated ? <TriangleAlert className="mt-0.5 size-3.5 shrink-0" /> : <Info className="mt-0.5 size-3.5 shrink-0" />}
          {s.note}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button size="sm" className="gap-1.5" onClick={onUse}><CheckCircle2 className="size-4" /> Use suggestion</Button>
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">View source details <ChevronDown className="size-3.5" /></Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="rounded-md bg-muted/50 p-2 text-caption text-muted-foreground">
              {meta.label} · {s.sourceName}{s.lastUpdated ? ` · last updated ${fmtDate(s.lastUpdated)}` : ""}.
              {meta.estimated
                ? " This is an estimate and must be confirmed with the vendor before it is quoted to a client."
                : s.type === "ai_quote"
                  ? " A quote was requested from this vendor for this lane."
                  : " This vendor already has a rate on file for a similar lane."}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

/** AI-assisted sourcing control for a single route stage: a labelled action that
    searches available sources, then opens a review drawer. The manager must
    explicitly confirm a suggestion — nothing is applied automatically. */
export function AiSourcing({
  step, vendors, baseCost, baseDays, label, ai, onAiChange, onApply,
}: {
  step: RouteStep;
  vendors: Vendor[];
  baseCost: number;
  baseDays: number;
  /** "Find rate with AI" or "Find vendor and rate with AI". */
  label: string;
  ai: AiState;
  onAiChange: (next: AiState) => void;
  onApply: (patch: Partial<RouteStep>) => void;
}) {
  const alreadyAi = !!step.provenance && PROVENANCE_META[step.provenance]?.ai;

  const search = () => {
    onAiChange({ phase: "searching", suggestions: [] });
    // Sourcing is async in reality; simulate the round-trip, then reveal results.
    window.setTimeout(() => {
      const found = generateSuggestions(step, vendors, baseCost, baseDays);
      onAiChange(found.length ? { phase: "suggestions", suggestions: found } : { phase: "empty", suggestions: [] });
    }, 1200);
  };

  const use = (s: AiSuggestion) => {
    onApply(suggestionPatch(s));
    onAiChange(IDLE_AI);
  };
  const dismiss = (id: string) => {
    const rest = ai.suggestions.filter((s) => s.id !== id);
    onAiChange(rest.length ? { phase: "suggestions", suggestions: rest } : IDLE_AI);
  };

  return (
    <>
      {/* persistent live region so AI-state transitions are announced to assistive tech */}
      <span role="status" aria-live="polite" className="inline-flex flex-wrap items-center gap-2">
        {ai.phase === "searching" ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" /> Searching available sources…
          </span>
        ) : ai.phase === "empty" ? (
          <>
            <span className="text-xs text-status-warning-fg">No matching source found. Try another vendor or enter the rate manually.</span>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={search}><RefreshCw className="size-3.5" /> Try again</Button>
          </>
        ) : ai.phase === "failed" ? (
          <>
            <span className="text-xs text-destructive">Search failed. You can retry or enter the rate manually.</span>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={search}><RefreshCw className="size-3.5" /> Retry</Button>
          </>
        ) : (
          <Button variant={alreadyAi ? "ghost" : "outline"} size="sm" className="gap-1.5" onClick={search}>
            <Sparkles className="size-4" /> {alreadyAi ? "Re-source with AI" : label}
          </Button>
        )}
      </span>

      <Sheet open={ai.phase === "suggestions"} onOpenChange={(o) => { if (!o) onAiChange(IDLE_AI); }}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /> AI sourcing — {step.title}</SheetTitle>
            <SheetDescription>
              Review the options below and confirm one. Nothing is applied until you choose “Use suggestion”.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 p-4">
            <p className="flex items-start gap-1.5 rounded-md bg-status-info-bg p-2 text-caption text-status-info-fg">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              AI suggestions and estimates must be verified before they are quoted to a client.
            </p>
            {ai.suggestions.map((s) => (
              <div key={s.id} className="space-y-2">
                <SuggestionCard s={s} onUse={() => use(s)} />
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => dismiss(s.id)}>Dismiss</Button>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
