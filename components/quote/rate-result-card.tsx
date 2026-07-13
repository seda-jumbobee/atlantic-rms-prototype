"use client";

import { Ship, Clock, CalendarDays, Anchor, ChevronRight, Star, AlertTriangle, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CarrierLogo } from "@/components/carrier-logo";
import { LegStages } from "@/components/quote/leg-stages";
import { SourceBadge } from "@/components/status-badge";
import { money, fmtDate } from "@/lib/format";
import type { RateOption } from "@/lib/types";

export function RateResultCard({
  rate,
  onChoose,
  onDetails,
}: {
  rate: RateOption;
  onChoose?: (rate: RateOption) => void;
  onDetails?: (rate: RateOption) => void;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
        {/* carrier + stages */}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <CarrierLogo carrierId={rate.carrierId} showName />
            <SourceBadge source={rate.sourceType} />
            {rate.recommended && (
              <Badge className="gap-1 bg-success/15 text-success"><Star className="size-3" /> Recommended</Badge>
            )}
            {rate.expired && (
              <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700">
                <AlertTriangle className="size-3" /> Rate expired — still quotable
              </Badge>
            )}
            {rate.via && rate.via !== "Direct" && (
              <Badge variant="outline" className="gap-1"><Anchor className="size-3" /> via {rate.via}</Badge>
            )}
          </div>

          <LegStages legs={rate.legs} compact />

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="size-3.5" /> {rate.transitDays} days transit</span>
            {rate.sailingDate && <span className="flex items-center gap-1"><Ship className="size-3.5" /> Sailing {fmtDate(rate.sailingDate)}</span>}
            {rate.vessel && <span className="flex items-center gap-1"><Anchor className="size-3.5" /> {rate.vessel}</span>}
            <span className="flex items-center gap-1"><CalendarDays className="size-3.5" /> Valid to {fmtDate(rate.validTo)}</span>
            {rate.contractNo && (
              <span className="flex items-center gap-1 font-mono text-[11px]"><FileText className="size-3.5" /> {rate.contractNo}</span>
            )}
          </div>
        </div>

        {/* total + actions */}
        <div className="flex shrink-0 items-end justify-between gap-3 border-t pt-3 lg:flex-col lg:items-end lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">All-in total</div>
            <div className="text-2xl font-bold tabular-nums">{money(rate.total)}</div>
            <div className="text-[11px] text-muted-foreground">{rate.currency} · expenses</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onDetails?.(rate)}>Details</Button>
            <Button size="sm" className="gap-1" onClick={() => onChoose?.(rate)}>
              Choose <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
