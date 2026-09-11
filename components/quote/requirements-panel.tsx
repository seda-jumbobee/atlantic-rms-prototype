"use client";

import { useState } from "react";
import { ShieldAlert, CheckCircle2, Bot, Sparkles, Send, Wand2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { money } from "@/lib/format";
import { vendorsForService } from "@/lib/data/vendors";
import type { RouteRequirement } from "@/lib/types";

function draftMessage(req: RouteRequirement, lane: string): string {
  return `Subject: Rate request — ${req.label} (${lane})

Hello,

Atlantic Project Cargo is preparing a shipment on the lane ${lane} that requires ${req.label}.
${req.reason}

Could you please provide your best rate and earliest availability for this service?
Estimated reference budget on our side: ${req.estimatedCost ? money(req.estimatedCost) : "TBC"}.

Kindly confirm validity and any prerequisites. Thank you.

Best regards,
Atlantic Project Cargo — Procurement
(sent via Front by RMS AI assistant)`;
}

function AiRequestDialog({ req, lane }: { req: RouteRequirement; lane: string }) {
  const [msg, setMsg] = useState(draftMessage(req, lane));
  const [sent, setSent] = useState(false);
  const candidates = vendorsForService(req.code === "FUMIGATION" ? "fumigation" : "customs");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Wand2 className="size-3.5" /> Request quote with AI
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="size-5 text-primary" /> AI vendor quote request
          </DialogTitle>
          <DialogDescription>
            No approved vendor for <b>{req.label}</b> on <b>{lane}</b>. The AI assistant drafted an RFQ — review and send via Front.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">Candidate vendors</div>
            <div className="flex flex-wrap gap-1.5">
              {candidates.length ? candidates.map((v) => (
                <Badge key={v.id} variant="secondary">{v.name} · tier {v.tier}</Badge>
              )) : <Badge variant="secondary">AI will source new vendors on this lane</Badge>}
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" /> Message preview (editable)
            </div>
            <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={12} className="font-mono text-xs" />
          </div>
        </div>

        <DialogFooter>
          {sent ? (
            <span className="flex items-center gap-1.5 text-sm text-status-positive-fg">
              <CheckCircle2 className="size-4" /> Sent via Front — awaiting reply in Rate Review
            </span>
          ) : (
            <Button
              className="gap-1.5"
              onClick={() => { setSent(true); toast.success("RFQ sent via Front", { description: `${req.label} request queued for vendor reply.` }); }}
            >
              <Send className="size-4" /> Send via Front
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RequirementsPanel({ requirements, lane }: { requirements: RouteRequirement[]; lane: string }) {
  if (!requirements.length) return null;
  return (
    <Card className="border-status-warning-fg/25 bg-status-warning-bg p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-status-warning-fg">
        <ShieldAlert className="size-4" /> Route requirements for this lane
      </div>
      <div className="space-y-2">
        {requirements.map((req) => (
          <div key={req.code} className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{req.label}</span>
                {req.hasVendor ? (
                  <StatusBadge tone="positive" dot={false}>vendor available</StatusBadge>
                ) : (
                  <StatusBadge tone="negative" dot={false}>no vendor on lane</StatusBadge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{req.reason}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {req.estimatedCost != null && (
                <span className="text-sm text-muted-foreground">~{money(req.estimatedCost)}</span>
              )}
              {req.hasVendor ? (
                <StatusBadge tone="positive" dot={false} className="gap-1"><CheckCircle2 className="size-3" /> auto-added</StatusBadge>
              ) : (
                <AiRequestDialog req={req} lane={lane} />
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
