"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { PricingStep } from "@/components/quote/pricing-step";
import { ReviewStep } from "@/components/quote/review-step";
import {
  computePricing,
  DEFAULT_SERVICE_METHOD,
  DEFAULT_SERVICE_VALUE,
  type PricingCalc,
  type PricingMethod,
  type PricingMode,
} from "@/lib/pricing";
import type { QuoteLeg, RateOption, ShipmentType } from "@/lib/types";

/** Everything the pricing + review steps read and mutate. Kept in one object so
    state survives navigation between Set pricing and Review & send. */
export interface PricingModel {
  legs: QuoteLeg[];
  setLegs: Dispatch<SetStateAction<QuoteLeg[]>>;
  mode: PricingMode;
  setMode: (m: PricingMode) => void;
  wholeMethod: PricingMethod;
  setWholeMethod: (m: PricingMethod) => void;
  wholeValue: number;
  setWholeValue: (v: number) => void;
  serviceMethod: Record<string, PricingMethod>;
  setServiceMethod: (id: string, m: PricingMethod) => void;
  serviceValue: Record<string, number>;
  setServiceValue: (id: string, v: number) => void;
  showCarrier: boolean;
  setShowCarrier: (v: boolean) => void;
  allInOnly: boolean;
  setAllInOnly: (v: boolean) => void;
  calc: PricingCalc;
}

export interface QuotePricingContext {
  rate: RateOption;
  quoteId: string;
  origin: string;
  destination: string;
  commodityLabel: string;
  shipmentType: ShipmentType;
}

export function QuotePricingFlow({
  reviewing,
  onReview,
  onBackToPricing,
  ...ctx
}: QuotePricingContext & {
  reviewing: boolean;
  onReview: () => void;
  onBackToPricing: () => void;
}) {
  const [legs, setLegs] = useState<QuoteLeg[]>(() => JSON.parse(JSON.stringify(ctx.rate.legs)) as QuoteLeg[]);
  const [mode, setMode] = useState<PricingMode>("whole");
  const [wholeMethod, setWholeMethod] = useState<PricingMethod>("markup");
  const [wholeValue, setWholeValue] = useState(DEFAULT_SERVICE_VALUE);
  const [serviceMethod, setServiceMethodMap] = useState<Record<string, PricingMethod>>({});
  const [serviceValue, setServiceValueMap] = useState<Record<string, number>>({});
  const [showCarrier, setShowCarrier] = useState(true);
  const [allInOnly, setAllInOnly] = useState(false);

  const calc = useMemo(
    () => computePricing({ legs, mode, wholeMethod, wholeValue, serviceMethod, serviceValue }),
    [legs, mode, wholeMethod, wholeValue, serviceMethod, serviceValue],
  );

  const model: PricingModel = {
    legs,
    setLegs,
    mode,
    setMode,
    wholeMethod,
    setWholeMethod,
    wholeValue,
    setWholeValue,
    serviceMethod,
    setServiceMethod: (id, m) => setServiceMethodMap((prev) => ({ ...prev, [id]: m })),
    serviceValue,
    setServiceValue: (id, v) => setServiceValueMap((prev) => ({ ...prev, [id]: v })),
    showCarrier,
    setShowCarrier,
    allInOnly,
    setAllInOnly,
    calc,
  };

  return reviewing ? (
    <ReviewStep model={model} onBackToPricing={onBackToPricing} {...ctx} />
  ) : (
    <PricingStep model={model} onReview={onReview} {...ctx} />
  );
}

// re-exported so callers can seed sensible defaults if needed
export { DEFAULT_SERVICE_METHOD, DEFAULT_SERVICE_VALUE };
