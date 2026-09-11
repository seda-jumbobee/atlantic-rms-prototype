"use client";

import { Card } from "@/components/ui/card";
import { CarrierName } from "@/components/carrier-name";
import { SourceBadge } from "@/components/status-badge";
import { PricingStep } from "@/components/quote/pricing-step";
import { ReviewStep } from "@/components/quote/review-step";
import { usePricingModel, type QuoteMeta } from "@/components/quote/pricing-parts";
import { getCarrier } from "@/lib/data/carriers";
import { money, fmtDate } from "@/lib/format";
import type { CommodityKind, RateOption, ShipmentType } from "@/lib/types";

export interface QuotePricingContext {
  rate: RateOption;
  quoteId: string;
  origin: string;
  destination: string;
  commodityLabel: string;
  commodityKind: CommodityKind;
  shipmentType: ShipmentType;
}

export function QuotePricingFlow({
  rate, quoteId, origin, destination, commodityLabel, commodityKind, shipmentType,
  reviewing, onReview, onBackToPricing,
}: QuotePricingContext & {
  reviewing: boolean;
  onReview: () => void;
  onBackToPricing: () => void;
}) {
  const model = usePricingModel(rate.legs);

  const meta: QuoteMeta = {
    quoteId, origin, destination, commodityLabel, commodityKind, shipmentType,
    currency: rate.currency, validTo: rate.validTo, transitDays: rate.transitDays, carrierId: rate.carrierId,
  };

  // Rate-Quote-specific context card shown atop Set pricing.
  const summary = (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        <div className="text-caption font-medium uppercase tracking-wide text-muted-foreground">Selected rate</div>
        <div className="flex flex-wrap items-center gap-2">
          <CarrierName carrierId={rate.carrierId} />
          <SourceBadge source={rate.sourceType} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
          <span>{rate.transitDays} days transit</span>
          <span>Valid to {fmtDate(rate.validTo)}</span>
          {rate.contractNo && <span>Contract <span className="font-mono text-foreground">{rate.contractNo}</span></span>}
        </div>
      </div>
      <div className="shrink-0 text-left sm:text-right">
        <div className="text-caption uppercase tracking-wide text-muted-foreground">Internal cost</div>
        <div className="text-xl font-bold tabular-nums">{money(model.calc.internalCost)}</div>
        <div className="text-caption text-muted-foreground">Before profit · {rate.currency}</div>
      </div>
    </Card>
  );

  const reminder = (
    <Card className="flex flex-row items-center gap-2 p-3 text-xs text-muted-foreground">
      <CarrierName carrierId={rate.carrierId} />
      <span className="truncate">{getCarrier(rate.carrierId)?.name}</span>
      <SourceBadge source={rate.sourceType} />
    </Card>
  );

  return reviewing ? (
    <ReviewStep model={model} meta={meta} reminder={reminder} onBackToPricing={onBackToPricing} templateKindLabel="pricing setup" />
  ) : (
    <PricingStep model={model} meta={meta} summary={summary} onReview={onReview} />
  );
}
