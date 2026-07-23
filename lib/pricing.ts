// Shared pricing model for the Rate Quote flow.
//
// One source of truth for "Internal cost + Profit = Client price" so that
// Set pricing and Review & send always agree, and the client-facing output
// can be derived without ever exposing internal cost / profit / margin.

import type { QuoteLeg, LegKind } from "@/lib/types";
import { legTotal } from "@/lib/quote-engine";

// Whole-quote vs per-service pricing — mutually exclusive.
export type PricingMode = "whole" | "service";

// How profit is expressed. Same three methods for whole-quote and per-service.
export type PricingMethod = "fixed" | "markup" | "margin";

export const METHOD_LABEL: Record<PricingMethod, string> = {
  fixed: "Fixed profit",
  markup: "Markup on cost",
  margin: "Target margin",
};

export const METHOD_TOOLTIP: Record<PricingMethod, string> = {
  fixed: "Add a set dollar amount of profit on top of the internal cost.",
  markup: "Add profit as a percentage of the internal cost.",
  margin: "Set profit so it equals this percentage of the final client price.",
};

// input adornment for the value field
export const METHOD_UNIT: Record<PricingMethod, "$" | "%"> = {
  fixed: "$",
  markup: "%",
  margin: "%",
};

const MAX_MARGIN = 95; // avoid divide-by-zero / runaway prices at 100% margin

/** Profit in dollars for a cost base, given a method and its value. */
export function profitFor(cost: number, method: PricingMethod, value: number): number {
  const v = Number.isFinite(value) ? value : 0;
  if (method === "fixed") return Math.max(0, Math.round(v));
  if (cost <= 0) return 0;
  if (method === "markup") return Math.round((cost * Math.max(0, v)) / 100);
  // target margin: client = cost / (1 - m); profit = client - cost
  const m = Math.min(Math.max(v, 0), MAX_MARGIN) / 100;
  return Math.round(cost / (1 - m) - cost);
}

/** The three read-only representations of a profit amount, for helper copy. */
export function equivalents(cost: number, profit: number) {
  const client = cost + profit;
  return {
    client,
    profit,
    markupPct: cost > 0 ? (profit / cost) * 100 : 0,
    marginPct: client > 0 ? (profit / client) * 100 : 0,
  };
}

export interface PricingState {
  legs: QuoteLeg[];
  mode: PricingMode;
  wholeMethod: PricingMethod;
  wholeValue: number;
  serviceMethod: Record<string, PricingMethod>;
  serviceValue: Record<string, number>;
}

export const DEFAULT_SERVICE_METHOD: PricingMethod = "markup";
export const DEFAULT_SERVICE_VALUE = 12;

export interface PricingCalc {
  included: QuoteLeg[];
  internalCost: number;
  profit: number;
  clientPrice: number;
  markupPct: number;
  marginPct: number;
  /** internal cost per included leg */
  legCost: Record<string, number>;
  /** profit per included leg (allocated in whole mode, direct in service mode) */
  legProfit: Record<string, number>;
  /** client-facing amount per included leg — always sums to clientPrice, never leaks cost */
  clientLegAmount: Record<string, number>;
}

/** Pure derivation of every number the UI and client output need. */
export function computePricing(s: PricingState): PricingCalc {
  const included = s.legs.filter((l) => l.included);
  const legCost: Record<string, number> = {};
  for (const l of included) legCost[l.id] = legTotal(l);
  const internalCost = included.reduce((sum, l) => sum + legCost[l.id], 0);

  const legProfit: Record<string, number> = {};
  const clientLegAmount: Record<string, number> = {};
  let profit = 0;

  if (s.mode === "service") {
    for (const l of included) {
      const method = s.serviceMethod[l.id] ?? DEFAULT_SERVICE_METHOD;
      const value = s.serviceValue[l.id] ?? DEFAULT_SERVICE_VALUE;
      const p = profitFor(legCost[l.id], method, value);
      legProfit[l.id] = p;
      clientLegAmount[l.id] = legCost[l.id] + p;
      profit += p;
    }
  } else {
    profit = profitFor(internalCost, s.wholeMethod, s.wholeValue);
    // Allocate whole-quote profit across services proportionally to cost so the
    // client itemization sums exactly to the client price and never shows raw cost.
    let allocated = 0;
    included.forEach((l, i) => {
      const share =
        i === included.length - 1
          ? profit - allocated // last leg absorbs the rounding remainder
          : internalCost > 0
            ? Math.round((profit * legCost[l.id]) / internalCost)
            : 0;
      if (i < included.length - 1) allocated += share;
      legProfit[l.id] = share;
      clientLegAmount[l.id] = legCost[l.id] + share;
    });
  }

  const clientPrice = internalCost + profit;
  return {
    included,
    internalCost,
    profit,
    clientPrice,
    markupPct: internalCost > 0 ? (profit / internalCost) * 100 : 0,
    marginPct: clientPrice > 0 ? (profit / clientPrice) * 100 : 0,
    legCost,
    legProfit,
    clientLegAmount,
  };
}

/** Client-safe line item derived from an included leg. */
export interface ClientLine {
  id: string;
  title: string;
  kind: LegKind;
  amount: number;
}

/** Build the client-facing lines (ocean surcharges consolidated into one line). */
export function clientLines(calc: PricingCalc): ClientLine[] {
  return calc.included.map((l) => ({
    id: l.id,
    title: l.kind === "ocean" ? "Ocean Freight (all-in)" : l.title,
    kind: l.kind,
    amount: calc.clientLegAmount[l.id] ?? 0,
  }));
}
