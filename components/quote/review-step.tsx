"use client";

import { useState } from "react";
import {
  Send, FileDown, MessageSquareText, Save, LayoutTemplate, Briefcase,
  EyeOff, ChevronDown, Pencil, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { CarrierLogo } from "@/components/carrier-logo";
import { SourceBadge } from "@/components/status-badge";
import { CreateDealDialog } from "@/components/deals/create-deal-dialog";
import { PdfPreview, SendViaFrontDialog, TextDialog, type OutputPayload } from "@/components/quote/quote-output";
import { getCarrier } from "@/lib/data/carriers";
import { getVendor } from "@/lib/data/vendors";
import { money, fmtDate } from "@/lib/format";
import { clientLines } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { QuotePricingContext, PricingModel } from "@/components/quote/quote-pricing-flow";

function pct(n: number): string {
  const r = Math.round(n * 10) / 10;
  return (Number.isInteger(r) ? r.toFixed(0) : r.toFixed(1)) + "%";
}

function SaveTemplateDialog({ defaultName }: { defaultName: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const valid = name.trim().length > 0;
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setName(defaultName); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
          <LayoutTemplate className="size-4" /> Save as template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save as template</DialogTitle>
          <DialogDescription>Reuse this pricing setup for similar shipments from Templates.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="tpl-name">Template name</Label>
          <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!valid} placeholder="e.g. Combine · US Gulf → Poti" />
          {!valid && <p className="text-xs font-medium text-destructive">Enter a template name.</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={!valid}
            onClick={() => { setOpen(false); toast.success("Saved as template", { description: `“${name.trim()}” is ready to reuse from Templates.` }); }}
          >
            <LayoutTemplate className="size-4" /> Save template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReviewStep({
  model, onBackToPricing, rate, quoteId, origin, destination, commodityLabel, shipmentType,
}: QuotePricingContext & { model: PricingModel; onBackToPricing: () => void }) {
  const { calc } = model;
  const lines = clientLines(calc);
  const carrierName = getCarrier(rate.carrierId)?.name;

  const payload: OutputPayload = {
    quoteId,
    ref: { origin, destination, commodityLabel, commodityKind: "equipment", shipmentType },
    clientTotal: calc.clientPrice,
    lines,
    currency: rate.currency,
    validTo: rate.validTo,
    transitDays: rate.transitDays,
    carrierId: rate.carrierId,
    showCarrier: model.showCarrier,
    allInOnly: model.allInOnly,
  };

  const [internalOpen, setInternalOpen] = useState(true);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      {/* left: client preview + internal summary */}
      <div className="min-w-0 space-y-4">
        {/* Client preview */}
        <Card className="gap-0 overflow-hidden p-0">
          <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold">Client preview</div>
            <Badge variant="secondary" className="gap-1 font-normal">This is what the client sees</Badge>
          </div>
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span><b className="text-foreground">Lane:</b> {origin} → {destination}</span>
              <span><b className="text-foreground">Commodity:</b> {commodityLabel}</span>
              <span><b className="text-foreground">Mode:</b> {shipmentType}</span>
              <span><b className="text-foreground">Transit:</b> ~{rate.transitDays} days</span>
              <span><b className="text-foreground">Valid to:</b> {fmtDate(rate.validTo)}</span>
              {model.showCarrier && rate.carrierId && (
                <span className="inline-flex items-center gap-1"><b className="text-foreground">Carrier:</b> <CarrierLogo carrierId={rate.carrierId} size="sm" /></span>
              )}
            </div>

            {!model.allInOnly ? (
              <table className="w-full border-t text-sm">
                <thead className="text-xs text-muted-foreground"><tr><th className="py-1.5 text-left font-medium">Service</th><th className="py-1.5 text-right font-medium">Amount</th></tr></thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="py-1.5 font-medium">{l.title}</td>
                      <td className="py-1.5 text-right tabular-nums">{money(l.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">All-in price only — the client sees a single total with no itemized breakdown.</p>
            )}

            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm font-medium">All-in price</span>
              <span className="text-2xl font-bold tabular-nums text-primary">{money(calc.clientPrice)} <span className="text-sm font-normal text-muted-foreground">{rate.currency}</span></span>
            </div>
          </div>

          {/* client-facing display options */}
          <div className="space-y-2 border-t bg-muted/20 px-5 py-3">
            <div className="text-caption font-medium uppercase tracking-wide text-muted-foreground">Client display options</div>
            <label className="flex items-center justify-between text-sm">
              <span>All-in price only <span className="text-muted-foreground">— hide the per-service breakdown</span></span>
              <Switch checked={model.allInOnly} onCheckedChange={model.setAllInOnly} />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>Show carrier name</span>
              <Switch checked={model.showCarrier} onCheckedChange={model.setShowCarrier} />
            </label>
          </div>
        </Card>

        {/* Internal summary — never shown to the client */}
        <Collapsible open={internalOpen} onOpenChange={setInternalOpen}>
          <Card className="gap-0 overflow-hidden border-dashed p-0">
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left outline-none transition hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <EyeOff className="size-4 text-muted-foreground" /> Internal summary
                <span className="text-xs font-normal text-muted-foreground">— not visible to the client</span>
              </div>
              <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", internalOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-4 border-t p-4">
                {/* headline economics */}
                <div className="grid grid-cols-3 gap-2">
                  <Metric label="Internal cost" value={money(calc.internalCost)} />
                  <Metric label="Profit" value={`+${money(calc.profit)}`} accent sub={`${pct(calc.marginPct)} margin · ${pct(calc.markupPct)} markup`} />
                  <Metric label="Client price" value={money(calc.clientPrice)} />
                </div>

                {/* per-service breakdown */}
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[440px] text-sm">
                    <thead className="bg-muted/50 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-1.5 text-left font-medium">Service</th>
                        <th className="hidden px-3 py-1.5 text-left font-medium sm:table-cell">Sourced from</th>
                        <th className="px-3 py-1.5 text-right font-medium">Cost</th>
                        <th className="px-3 py-1.5 text-right font-medium">Profit</th>
                        <th className="px-3 py-1.5 text-right font-medium">Client</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {calc.included.map((l) => {
                        const source = l.kind === "ocean" ? getCarrier(l.carrierId)?.name : getVendor(l.vendorId)?.name;
                        return (
                          <tr key={l.id}>
                            <td className="px-3 py-1.5 font-medium">{l.title}</td>
                            <td className="hidden px-3 py-1.5 text-muted-foreground sm:table-cell">{source ?? "—"}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums">{money(calc.legCost[l.id] ?? 0)}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums text-status-positive-fg">+{money(calc.legProfit[l.id] ?? 0)}</td>
                            <td className="px-3 py-1.5 text-right font-medium tabular-nums">{money(calc.clientLegAmount[l.id] ?? 0)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Button variant="outline" size="sm" className="gap-1.5" onClick={onBackToPricing}>
                  <Pencil className="size-4" /> Edit pricing
                </Button>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* right: send actions */}
      <div className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Card className="space-y-3 p-4">
          <div className="text-sm font-semibold">Send quote</div>
          <p className="flex items-start gap-1.5 rounded-md bg-status-positive-bg/60 p-2 text-caption text-status-positive-fg">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
            Only the client price and services are shared. Internal cost, profit, vendors and surcharges stay internal.
          </p>

          <SendViaFrontDialog payload={payload} trigger={
            <Button className="w-full gap-1.5"><Send className="size-4" /> Send via Front</Button>
          } />
          <PdfPreview payload={payload} trigger={
            <Button variant="outline" className="w-full gap-1.5"><FileDown className="size-4" /> Preview PDF</Button>
          } />

          <Separator />
          <div className="text-caption font-medium uppercase tracking-wide text-muted-foreground">More actions</div>
          <div className="space-y-1">
            <TextDialog payload={payload} trigger={
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2"><MessageSquareText className="size-4" /> Text message</Button>
            } />
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2"
              onClick={() => toast.success("Quote saved", { description: `${quoteId} saved to history.` })}>
              <Save className="size-4" /> Save quote
            </Button>
            <SaveTemplateDialog defaultName={`${commodityLabel} · ${origin} → ${destination}`} />
            <CreateDealDialog trigger={
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2"><Briefcase className="size-4" /> Create deal</Button>
            } />
          </div>
        </Card>

        {/* selected rate reminder */}
        <Card className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
          <CarrierLogo carrierId={rate.carrierId} size="sm" />
          <span className="truncate">{carrierName}</span>
          <SourceBadge source={rate.sourceType} />
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border p-2.5">
      <div className="text-caption uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("text-sm font-bold tabular-nums", accent && "text-status-positive-fg")}>{value}</div>
      {sub && <div className="text-caption text-muted-foreground">{sub}</div>}
    </div>
  );
}
