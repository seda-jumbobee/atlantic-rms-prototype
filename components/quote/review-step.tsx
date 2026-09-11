"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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
import { RequiredMark } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { CarrierName } from "@/components/carrier-name";
import { CreateDealDialog } from "@/components/deals/create-deal-dialog";
import { PdfPreview, SendViaFrontDialog, TextDialog, type OutputPayload } from "@/components/quote/quote-output";
import { getCarrier } from "@/lib/data/carriers";
import { getVendor } from "@/lib/data/vendors";
import { QUOTE_TEMPLATES } from "@/lib/data/templates";
import { money, fmtDate } from "@/lib/format";
import { clientLines } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { pct, type PricingModel, type QuoteMeta } from "@/components/quote/pricing-parts";

function SaveTemplateDialog({ defaultName, kindLabel, savedSummary }: { defaultName: string; kindLabel: string; savedSummary: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState("");
  const trimmed = name.trim();
  const duplicate = QUOTE_TEMPLATES.some((t) => t.name.trim().toLowerCase() === trimmed.toLowerCase());
  const err = !trimmed ? "Enter a template title" : duplicate ? "A template with this name already exists" : null;
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setName(defaultName); setDescription(""); } }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
          <LayoutTemplate className="size-4" /> Save as template
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as template</DialogTitle>
          <DialogDescription>Save this {kindLabel} to reuse for similar shipments from Templates.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name"><span>Template title<RequiredMark /></span></Label>
            <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!err} placeholder="e.g. Combine · US Gulf → Poti" />
            {err && <p role="alert" className="text-xs font-medium text-destructive">{err}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-desc">Description <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Textarea id="tpl-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="When to use this template…" />
          </div>
          {/* what will be saved — reusable config only, no client price / sent status */}
          <div className="space-y-1 rounded-md border bg-muted/40 p-3">
            <div className="text-caption font-medium uppercase tracking-wide text-muted-foreground">Saved in this template</div>
            {savedSummary}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={!!err}
            onClick={() => {
              setOpen(false);
              toast.success("Template saved", {
                description: `“${trimmed}” is ready to reuse from Templates.`,
                action: { label: "View template", onClick: () => router.push("/templates") },
              });
            }}
          >
            <LayoutTemplate className="size-4" /> Save template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReviewStep({
  model, meta, onBackToPricing, reminder, templateKindLabel = "pricing setup",
}: {
  model: PricingModel;
  meta: QuoteMeta;
  onBackToPricing: () => void;
  /** Small context card shown under the send actions (selected rate / route recap). */
  reminder?: ReactNode;
  templateKindLabel?: string;
}) {
  const { calc } = model;
  const lines = clientLines(calc);

  const payload: OutputPayload = {
    quoteId: meta.quoteId,
    ref: { origin: meta.origin, destination: meta.destination, commodityLabel: meta.commodityLabel, commodityKind: meta.commodityKind, shipmentType: meta.shipmentType },
    clientTotal: calc.clientPrice,
    lines,
    currency: meta.currency,
    validTo: meta.validTo,
    transitDays: meta.transitDays,
    carrierId: meta.carrierId,
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
          <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-5 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold">Client preview</div>
            <Badge variant="secondary" className="gap-1 font-normal">This is what the client sees</Badge>
          </div>
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span><b className="text-foreground">Quote:</b> {meta.quoteId}</span>
              <span><b className="text-foreground">Lane:</b> {meta.origin} → {meta.destination}</span>
              <span><b className="text-foreground">Commodity:</b> {meta.commodityLabel}</span>
              <span><b className="text-foreground">Mode:</b> {meta.shipmentType}</span>
              <span><b className="text-foreground">Transit:</b> ~{meta.transitDays} days</span>
              <span><b className="text-foreground">Valid to:</b> {fmtDate(meta.validTo)}</span>
              {model.showCarrier && meta.carrierId && (
                <span className="inline-flex items-center gap-1"><b className="text-foreground">Carrier:</b> <CarrierName carrierId={meta.carrierId} /></span>
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
              <span className="text-2xl font-bold tabular-nums text-primary">{money(calc.clientPrice)} <span className="text-sm font-normal text-muted-foreground">{meta.currency}</span></span>
            </div>
          </div>

          {/* client-facing display options */}
          <div className="space-y-2 border-t bg-muted/20 px-5 py-3">
            <div className="text-caption font-medium uppercase tracking-wide text-muted-foreground">Client display options</div>
            <label className="flex items-center justify-between text-sm">
              <span>All-in price only <span className="text-muted-foreground">— hide the per-service breakdown</span></span>
              <Switch checked={model.allInOnly} onCheckedChange={model.setAllInOnly} aria-label="All-in price only" />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>Show carrier name</span>
              <Switch checked={model.showCarrier} onCheckedChange={model.setShowCarrier} aria-label="Show carrier name" />
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
              onClick={() => toast.success("Quote saved", { description: `${meta.quoteId} saved to history.` })}>
              <Save className="size-4" /> Save quote
            </Button>
            <SaveTemplateDialog
              defaultName={`${meta.commodityLabel} · ${meta.origin} → ${meta.destination}`}
              kindLabel={templateKindLabel}
              savedSummary={
                <ul className="space-y-0.5 text-xs text-muted-foreground">
                  <li><span className="text-foreground">Lane:</span> {meta.origin} → {meta.destination}</li>
                  <li><span className="text-foreground">Commodity:</span> {meta.commodityLabel} · {meta.shipmentType}</li>
                  <li><span className="text-foreground">Services:</span> {calc.included.length} {calc.included.length === 1 ? "service" : "services"} (no prices — profit is set each time)</li>
                </ul>
              }
            />
            <CreateDealDialog trigger={
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2"><Briefcase className="size-4" /> Create deal</Button>
            } />
          </div>
        </Card>

        {reminder}
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
