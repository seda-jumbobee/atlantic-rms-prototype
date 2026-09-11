"use client";

import { useState } from "react";
import {
  Ship, Clock, CalendarDays, Anchor, ChevronRight, Star, AlertTriangle, FileText, Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CarrierName } from "@/components/carrier-name";
import { LegStages } from "@/components/quote/leg-stages";
import { ChargeTable } from "@/components/quote/charge-table";
import { SourceBadge } from "@/components/status-badge";
import { getCarrier } from "@/lib/data/carriers";
import { money, fmtDate } from "@/lib/format";
import { legTotal } from "@/lib/quote-engine";
import type { RateOption } from "@/lib/types";

/** Full internal breakdown — opened by "View details". Does NOT select the rate. */
function RateDetails({ rate }: { rate: RateOption }) {
  const included = rate.legs.filter((l) => l.included);
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CarrierName carrierId={rate.carrierId} /> <SourceBadge source={rate.sourceType} />
        </DialogTitle>
        <DialogDescription>Internal cost breakdown — before profit. Not shown to the client.</DialogDescription>
      </DialogHeader>

      <LegStages legs={rate.legs} showPrices />

      <div className="space-y-4">
        {included.map((leg) => (
          <div key={leg.id} className="space-y-1.5">
            <div className="text-sm font-medium">{leg.title} <span className="font-normal text-muted-foreground">· {leg.from} → {leg.to}</span></div>
            <ChargeTable charges={leg.charges} onChange={() => {}} editable={false} />
          </div>
        ))}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t pt-3 text-sm">
        <Meta label="Transit" value={`${rate.transitDays} days`} />
        {rate.sailingDate && <Meta label="Sailing" value={fmtDate(rate.sailingDate)} />}
        {rate.vessel && <Meta label="Vessel / voyage" value={rate.vessel} />}
        <Meta label="Validity" value={`to ${fmtDate(rate.validTo)}`} />
        <Meta label="Source" value={rate.sourceType} />
        {rate.contractNo && <Meta label="Contract" value={rate.contractNo} mono />}
      </dl>

      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-sm font-medium">Total internal cost</span>
        <span className="text-lg font-bold tabular-nums">{money(rate.total)} <span className="text-sm font-normal text-muted-foreground">{rate.currency}</span></span>
      </div>
    </DialogContent>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-xs" : "font-medium"}>{value}</dd>
    </div>
  );
}

export function RateResultCard({
  rate,
  onSelect,
}: {
  rate: RateOption;
  onSelect: (rate: RateOption) => void;
}) {
  const [selecting, setSelecting] = useState(false);
  const [confirmExpired, setConfirmExpired] = useState(false);
  const carrierName = getCarrier(rate.carrierId)?.name ?? "Carrier";

  const doSelect = () => {
    setSelecting(true);
    // brief loading state while the selection is applied (rate assembly is synchronous)
    setTimeout(() => onSelect(rate), 450);
  };
  const onSelectClick = () => {
    if (rate.expired) setConfirmExpired(true);
    else doSelect();
  };

  return (
    <Card className={rate.expired ? "overflow-hidden border-status-warning-fg/30 p-0" : "overflow-hidden p-0"}>
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-stretch">
        {/* left: carrier, badges, service summary, metadata */}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <CarrierName carrierId={rate.carrierId} />
            <SourceBadge source={rate.sourceType} />
            {rate.recommended && !rate.expired && (
              <Badge variant="status-positive" className="gap-1"><Star className="size-3" /> Recommended</Badge>
            )}
            {rate.expired && (
              <Badge variant="status-warning" className="gap-1">
                <AlertTriangle className="size-3" /> Rate expired
              </Badge>
            )}
            {rate.via && rate.via !== "Direct" && (
              <Badge variant="outline" className="gap-1"><Anchor className="size-3" /> via {rate.via}</Badge>
            )}
          </div>

          {rate.recommended && !rate.expired && (
            <p className="text-xs font-medium text-status-positive-fg">Best valid rate for this lane</p>
          )}
          {rate.expired && (
            <p className="text-xs font-medium text-status-warning-fg">Expired {fmtDate(rate.validTo)} — may no longer be valid</p>
          )}

          {/* service / route summary — no per-leg prices here (breakdown is in View details) */}
          <LegStages legs={rate.legs} showPrices={false} compact />

          {/* metadata */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
            <span className="flex items-center gap-1.5"><Clock className="size-3.5 text-muted-foreground" /> <span className="font-medium">{rate.transitDays} days</span> transit</span>
            {rate.sailingDate && <span className="flex items-center gap-1.5"><Ship className="size-3.5 text-muted-foreground" /> Sailing <span className="font-medium">{fmtDate(rate.sailingDate)}</span></span>}
            {rate.vessel && <span className="flex items-center gap-1.5"><Anchor className="size-3.5 text-muted-foreground" /> {rate.vessel}</span>}
            <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5 text-muted-foreground" /> Valid to <span className="font-medium">{fmtDate(rate.validTo)}</span></span>
          </div>
          {rate.contractNo && (
            <div className="flex items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
              <FileText className="size-3.5" /> Contract <span className="font-mono text-foreground">{rate.contractNo}</span>
            </div>
          )}
        </div>

        {/* right: internal cost + actions */}
        <div className="flex shrink-0 items-end justify-between gap-3 border-t pt-3 lg:min-w-44 lg:flex-col lg:items-end lg:justify-between lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <div className="text-right">
            <div className="text-caption uppercase tracking-wide text-muted-foreground">Internal cost</div>
            <div className="text-2xl font-bold tabular-nums">{money(rate.total)}</div>
            <div className="text-caption text-muted-foreground">Before profit · {rate.currency}</div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">View details</Button>
              </DialogTrigger>
              <RateDetails rate={rate} />
            </Dialog>
            <Button size="sm" className="gap-1" onClick={onSelectClick} disabled={selecting} aria-busy={selecting}>
              {selecting ? <><Loader2 className="size-4 animate-spin" /> Selecting…</> : <>Select rate <ChevronRight className="size-4" /></>}
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmExpired} onOpenChange={setConfirmExpired}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>This rate has expired</AlertDialogTitle>
            <AlertDialogDescription>
              {carrierName}&apos;s rate expired on {fmtDate(rate.validTo)} and may no longer be valid. You can still
              build a quote from it, but confirm the price with the carrier before sending to the client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doSelect}>Continue with expired rate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
