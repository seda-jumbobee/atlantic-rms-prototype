"use client";

import { useState } from "react";
import { FileDown, Mail, MessageSquareText, Send, Copy, Check, Anchor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { LegStages } from "@/components/quote/leg-stages";
import { CarrierLogo } from "@/components/carrier-logo";
import { LogoMark } from "@/components/logo";
import { money, fmtDate } from "@/lib/format";
import { legTotal, chargeTotal } from "@/lib/quote-engine";
import type { QuoteLeg, QuoteRef } from "@/lib/types";

export interface OutputPayload {
  quoteId: string;
  ref: QuoteRef;
  legs: QuoteLeg[];
  buy: number;
  sell: number;
  margin: number;
  currency: string;
  validTo: string;
  transitDays: number;
  carrierId?: string;
  showLineNames: boolean;
  allInOnly: boolean;
}

function textSummary(p: OutputPayload): string {
  const lines = [
    `Atlantic Project Cargo — Quote ${p.quoteId}`,
    `${p.ref.origin} → ${p.ref.destination}`,
    `Commodity: ${p.ref.commodityLabel} (${p.ref.shipmentType})`,
    `Transit: ~${p.transitDays} days · Valid to ${fmtDate(p.validTo)}`,
    ``,
  ];
  if (!p.allInOnly) {
    for (const leg of p.legs.filter((l) => l.included)) lines.push(`• ${leg.title}: ${money(legTotal(leg))}`);
    lines.push("");
  }
  lines.push(`ALL-IN PRICE: ${money(p.sell)} ${p.currency}`);
  lines.push(`(subject to space & equipment availability)`);
  return lines.join("\n");
}

export function QuoteOutput({ payload }: { payload: OutputPayload }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <PdfPreview payload={payload} />
      <EmailDialog payload={payload} />
      <TextDialog payload={payload} />
    </div>
  );
}

function PdfPreview({ payload: p }: { payload: OutputPayload }) {
  const included = p.legs.filter((l) => l.included);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1.5"><FileDown className="size-4" /> Preview PDF</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader className="sr-only"><DialogTitle>Quote PDF preview</DialogTitle></DialogHeader>
        {/* document */}
        <div className="space-y-4 rounded-lg border bg-card p-6 text-sm text-card-foreground">
          <div className="flex items-start justify-between border-b pb-3">
            <div>
              <div className="text-lg font-semibold">Quote {p.quoteId}</div>
              <div className="text-xs text-muted-foreground">Issued {fmtDate(new Date().toISOString())} · Valid through {fmtDate(p.validTo)}</div>
            </div>
            <div className="flex items-center gap-2"><LogoMark className="size-9" /><div className="text-right text-xs leading-tight"><div className="font-semibold">Atlantic Project Cargo</div><div className="text-muted-foreground">Rate Management</div></div></div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <span><b>Lane:</b> {p.ref.origin} → {p.ref.destination}</span>
            <span><b>Commodity:</b> {p.ref.commodityLabel}</span>
            <span><b>Mode:</b> {p.ref.shipmentType}</span>
            <span><b>Transit:</b> ~{p.transitDays} days</span>
            {p.showLineNames && p.carrierId && <span className="inline-flex items-center gap-1"><b>Carrier:</b> <CarrierLogo carrierId={p.carrierId} size="sm" /></span>}
          </div>

          <LegStages legs={p.legs} showPrices={!p.allInOnly} />

          {!p.allInOnly ? (
            <>
              {/* Client-facing: one all-in line per service — ocean surcharges consolidated, never itemized */}
              <table className="w-full border-t text-xs">
                <thead className="text-muted-foreground"><tr><th className="py-1 text-left">Service</th><th className="py-1 text-right">Amount</th></tr></thead>
                <tbody>
                  {included.map((leg) => (
                    <tr key={leg.id} className="border-t">
                      <td className="py-1 font-medium">{leg.kind === "ocean" ? "Ocean Freight (all-in)" : leg.title}</td>
                      <td className="py-1 text-right tabular-nums">{money(legTotal(leg))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-caption text-muted-foreground">Surcharges are consolidated into each service line. Full carrier breakdown is internal to Atlantic Project Cargo.</p>
            </>
          ) : (
            <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">All-in price only — itemized breakdown hidden for the client.</p>
          )}

          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-sm font-medium">All-in price</span>
            <span className="text-xl font-bold">{money(p.sell)} {p.currency}</span>
          </div>
          <p className="text-caption leading-relaxed text-muted-foreground">
            Rates subject to space & equipment availability at time of booking. Surcharges valid as of issue date.
            Generated by Atlantic RMS.
          </p>
        </div>
        <DialogFooter>
          <Button className="gap-1.5" onClick={() => toast.success("PDF generated", { description: `${p.quoteId}.pdf ready to download.` })}>
            <FileDown className="size-4" /> Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmailDialog({ payload: p }: { payload: OutputPayload }) {
  const [body, setBody] = useState(textSummary(p));
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-1.5"><Mail className="size-4" /> Email via Front</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Mail className="size-5 text-primary" /> Send quote via Front</DialogTitle>
          <DialogDescription>Composes the commercial offer in Front and attaches the PDF.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm">
            <Label>To</Label><Input defaultValue="customer@client.com" />
            <Label>Subject</Label><Input defaultValue={`Atlantic Project Cargo — Quote ${p.quoteId} (${p.ref.origin} → ${p.ref.destination})`} />
          </div>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="text-xs" />
          <Badge variant="secondary" className="gap-1"><FileDown className="size-3" /> {p.quoteId}.pdf attached</Badge>
        </div>
        <DialogFooter>
          <Button className="gap-1.5" onClick={() => toast.success("Sent via Front", { description: "Offer emailed; deal updated in Kommo CRM." })}>
            <Send className="size-4" /> Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TextDialog({ payload: p }: { payload: OutputPayload }) {
  const [copied, setCopied] = useState(false);
  const text = textSummary(p);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1.5"><MessageSquareText className="size-4" /> Text message</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><MessageSquareText className="size-5 text-primary" /> Text / WhatsApp message</DialogTitle>
          <DialogDescription>Short message for quick quoting over messengers.</DialogDescription>
        </DialogHeader>
        <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs">{text}</pre>
        <DialogFooter>
          <Button className="gap-1.5" onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); toast.success("Copied to clipboard"); }}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy message"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
