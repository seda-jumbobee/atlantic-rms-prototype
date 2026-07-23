"use client";

import { useMemo, useState } from "react";
import {
  ClipboardCheck, Truck, Forklift, Warehouse, Ship, MapPin, ArrowLeft, TrendingUp,
  Save, Briefcase, Eye, EyeOff, Tag, LayoutTemplate, Pencil,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChargeTable } from "@/components/quote/charge-table";
import { QuoteOutput, type OutputPayload } from "@/components/quote/quote-output";
import { CreateDealDialog } from "@/components/deals/create-deal-dialog";
import { CarrierLogo } from "@/components/carrier-logo";
import { useIsAdmin } from "@/components/session-provider";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { legTotal } from "@/lib/quote-engine";
import { CARRIERS } from "@/lib/data/carriers";
import { VENDORS } from "@/lib/data/vendors";
import { DATA_SOURCES } from "@/lib/data/vendors";
import type { RateOption, QuoteLeg, LegKind, ChargeLine } from "@/lib/types";

const LEG_ICON: Record<LegKind, typeof Truck> = {
  preparation: ClipboardCheck, inland: Truck, loading: Forklift, cfs: Warehouse, drayage: Truck, ocean: Ship, oncarriage: MapPin,
};

export function QuoteEditor({
  rate, quoteId, origin, destination, commodityLabel, shipmentType, onBack, hideBack = false,
}: {
  rate: RateOption;
  quoteId: string;
  origin: string;
  destination: string;
  commodityLabel: string;
  shipmentType: string;
  onBack: () => void;
  hideBack?: boolean;
}) {
  const isAdmin = useIsAdmin();
  const [legs, setLegs] = useState<QuoteLeg[]>(() => JSON.parse(JSON.stringify(rate.legs)) as QuoteLeg[]);
  const [marginPerLeg, setMarginPerLeg] = useState<Record<string, number>>({});
  const buy = useMemo(() => legs.reduce((s, l) => s + legTotal(l), 0), [legs]);
  const [markupType, setMarkupType] = useState<"flat" | "percent" | "margin">("flat");
  const [markupValue, setMarkupValue] = useState(() => Math.round((rate.total * 0.12) / 50) * 50);
  const [showLineNames, setShowLineNames] = useState(true);
  const [allInOnly, setAllInOnly] = useState(false);

  const legMargin = Object.entries(marginPerLeg).reduce(
    (s, [id, m]) => s + (legs.find((l) => l.id === id)?.included ? m : 0), 0,
  );
  // markup applied to the buy total — flat $, % markup, or a target margin % ("маржинальность")
  const baseMarkup =
    markupType === "flat"
      ? markupValue
      : markupType === "percent"
        ? Math.round((buy * markupValue) / 100)
        : Math.round(buy / (1 - Math.min(markupValue, 95) / 100) - buy);
  const margin = baseMarkup + legMargin;
  const sell = buy + margin;
  const marginPct = sell ? Math.round((margin / sell) * 100) : 0; // realized margin %

  const changeMarkupType = (t: "flat" | "percent" | "margin") => {
    setMarkupType(t);
    setMarkupValue(t === "flat" ? Math.round((buy * 0.12) / 50) * 50 : t === "percent" ? 12 : 15);
  };

  const patchLeg = (id: string, patch: Partial<QuoteLeg>) => setLegs((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const setCharges = (id: string, charges: ChargeLine[]) => patchLeg(id, { charges });

  const payload: OutputPayload = {
    quoteId, ref: { origin, destination, commodityLabel, commodityKind: "equipment", shipmentType: shipmentType as never },
    legs, buy, sell, margin, currency: "USD", validTo: rate.validTo, transitDays: rate.transitDays,
    carrierId: rate.carrierId, showLineNames, allInOnly,
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      {/* left: legs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {hideBack ? <span /> : (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={onBack}><ArrowLeft className="size-4" /> Back to rates</Button>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CarrierLogo carrierId={rate.carrierId} size="sm" />
            {rate.transitDays} days · valid to {new Date(rate.validTo).toLocaleDateString()}
            {rate.contractNo && <span className="font-mono text-xs">· {rate.contractNo}</span>}
          </div>
        </div>

        {legs.map((leg) => {
          const Icon = LEG_ICON[leg.kind];
          return (
            <Card key={leg.id} className={leg.included ? "p-4" : "p-4 opacity-60"}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></div>
                  <div>
                    <div className="font-medium">{leg.title}</div>
                    <div className="text-xs text-muted-foreground">{leg.from} → {leg.to}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums">{money(legTotal(leg))}</span>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    Include <Switch checked={leg.included} onCheckedChange={(v) => patchLeg(leg.id, { included: v })} />
                  </label>
                </div>
              </div>

              {/* leg source / vendor / carrier */}
              <div className="mb-3 grid gap-2 sm:grid-cols-3">
                {leg.kind === "ocean" ? (
                  <Field label="Carrier">
                    <Select value={leg.carrierId} onValueChange={(v) => patchLeg(leg.id, { carrierId: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{CARRIERS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                ) : (
                  <Field label="Vendor">
                    <Select value={leg.vendorId} onValueChange={(v) => patchLeg(leg.id, { vendorId: v })}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                      <SelectContent>{VENDORS.map((v) => <SelectItem key={v.id} value={v.id}>{v.name} · T{v.tier}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                )}
                {isAdmin && (
                  <Field label="Source">
                    <Select value={leg.dataSourceId} onValueChange={(v) => patchLeg(leg.id, { dataSourceId: v })}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="Rate source" /></SelectTrigger>
                      <SelectContent>{DATA_SOURCES.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                )}
                <Field label="Margin on leg ($)">
                  <Input type="number" className="h-8" value={marginPerLeg[leg.id] ?? 0}
                    onChange={(e) => setMarginPerLeg((m) => ({ ...m, [leg.id]: Number(e.target.value) }))} />
                </Field>
              </div>

              {leg.included && <ChargeTable charges={leg.charges} onChange={(c) => setCharges(leg.id, c)} />}
            </Card>
          );
        })}
      </div>

      {/* right: margin + offer settings + output */}
      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-1.5 text-sm font-medium"><TrendingUp className="size-4 text-primary" /> Pricing</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Buy" value={money(buy)} sub="expenses" />
            <Stat label="You earn" value={money(margin)} sub={`margin ${marginPct}%`} accent />
            <Stat label="Sell" value={money(sell)} sub="all-in" />
          </div>
          <Separator className="my-3" />
          <Label className="text-xs text-muted-foreground">Markup type</Label>
          <div className="mt-1 grid grid-cols-3 gap-1 rounded-md border p-0.5 text-xs">
            {([["flat", "Flat $"], ["percent", "Markup %"], ["margin", "Margin %"]] as const).map(([v, l]) => (
              <button key={v} type="button" onClick={() => changeMarkupType(v)}
                className={cn("rounded px-2 py-1.5 font-medium transition", markupType === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                {l}
              </button>
            ))}
          </div>
          <div className="mt-2">
            <Input type="number" value={markupValue} onChange={(e) => setMarkupValue(Number(e.target.value))} />
          </div>
          <p className="mt-1 text-caption text-muted-foreground">
            {markupType === "flat" && `Flat ${money(markupValue)} markup on buy.`}
            {markupType === "percent" && `${markupValue}% markup on buy → +${money(baseMarkup)}.`}
            {markupType === "margin" && `Target margin ${markupValue}% → sell ${money(sell)} (маржинальность).`}
            {" "}RMS = expenses; sale & margin set by the manager (markup or per-leg).
          </p>
        </Card>

        <Card className="space-y-3 p-4">
          <div className="text-sm font-medium">Offer settings</div>
          <label className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5">{allInOnly ? <EyeOff className="size-4" /> : <Eye className="size-4" />} All-in price only</span>
            <Switch checked={allInOnly} onCheckedChange={setAllInOnly} />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5"><Tag className="size-4" /> Show line names</span>
            <Switch checked={showLineNames} onCheckedChange={setShowLineNames} />
          </label>
        </Card>

        <Card className="space-y-3 p-4">
          <div className="text-sm font-medium">Generate / re-send offer</div>
          <p className="flex items-start gap-1.5 rounded-md bg-muted/40 p-2 text-caption text-muted-foreground">
            <Pencil className="mt-0.5 size-3.5 shrink-0 text-primary" />
            Edit any leg above (e.g. unforeseen costs during processing), then re-send the updated quote via Front / message / PDF — edits feed payroll.
          </p>
          <QuoteOutput payload={payload} />
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success("Quote saved", { description: `${quoteId} saved to history.` })}>
              <Save className="size-4" /> Save quote
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5"
              onClick={() => toast.success("Saved as template", { description: `${commodityLabel} · ${origin} → ${destination} — reuse from Templates.` })}>
              <LayoutTemplate className="size-4" /> Save as template
            </Button>
            <CreateDealDialog trigger={
              <Button variant="outline" size="sm" className="gap-1.5">
                <Briefcase className="size-4" /> Create deal
              </Button>
            } />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border p-2">
      <div className="text-caption uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-bold tabular-nums">{value}</div>
      {sub && <div className={accent ? "text-caption font-medium text-status-positive-fg" : "text-caption text-muted-foreground"}>{sub}</div>}
    </div>
  );
}
