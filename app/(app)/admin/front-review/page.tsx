"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, X, Mail, Inbox, CheckCircle2, XCircle, Sparkles, Copy, User } from "lucide-react";
import { AdminGate } from "@/components/admin-gate";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { CarrierLogo } from "@/components/carrier-logo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FRONT_RATE_REQUESTS, getVendor, getUser, findFrontDuplicates, DEDUP_WINDOW_DAYS } from "@/lib/data";
import type { FrontRateRequest } from "@/lib/types";
import { money, fmtDate, relativeAge } from "@/lib/format";
import { cn } from "@/lib/utils";

type Status = FrontRateRequest["status"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <div className="text-caption uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium tabular-nums">{children}</div>
    </div>
  );
}

function confidenceTone(c: number): string {
  if (c >= 0.9) return "text-status-positive-fg";
  if (c >= 0.8) return "text-status-warning-fg";
  return "text-status-negative-fg";
}

function ReviewCard({
  req,
  onApprove,
  onReject,
}: {
  req: FrontRateRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const vendor = getVendor(req.vendorId);
  const p = req.parsed;
  const pct = Math.round(req.confidence * 100);
  const dupes = findFrontDuplicates(req);
  const requester = getUser(req.salesRequestedBy);
  const dupOf = dupes[0];
  const dupBy = getUser(dupOf?.salesRequestedBy);

  return (
    <Card className={cn(req.status !== "new" && "opacity-75", dupes.length > 0 && "border-warning")}>
      <CardContent className="space-y-4 p-5">
        {dupes.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-warning bg-status-warning-bg p-2.5 text-xs text-status-warning-fg">
            <Copy className="mt-0.5 size-4 shrink-0" />
            <span>
              <b>Possible duplicate request.</b> Same lane &amp; mode ({p.lane} · {p.shipmentType}) was already requested by{" "}
              <b>{dupBy?.name ?? "another sales"}</b> {relativeAge(dupOf.receivedAt)} — within the {DEDUP_WINDOW_DAYS}-day dedup window.
              Reuse that quote instead of re-requesting from the vendor.
            </span>
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {req.carrierId ? (
              <CarrierLogo carrierId={req.carrierId} size="md" />
            ) : (
              <div className="grid size-9 place-items-center rounded-md bg-muted text-muted-foreground">
                <Mail className="size-4" />
              </div>
            )}
            <div className="space-y-0.5">
              <div className="font-medium leading-tight">{req.subject}</div>
              <div className="text-xs text-muted-foreground">
                {req.fromName} · {req.fromEmail}
                {vendor && !req.carrierId && <> · {vendor.name}</>}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {relativeAge(req.receivedAt)} · {fmtDate(req.receivedAt)}
                {requester && (
                  <span className="inline-flex items-center gap-0.5"><User className="size-3" /> {requester.name}</span>
                )}
              </div>
            </div>
          </div>
          {req.status === "approved" && (
            <StatusBadge tone="positive">Approved</StatusBadge>
          )}
          {req.status === "rejected" && (
            <StatusBadge tone="negative">Rejected</StatusBadge>
          )}
          {req.status === "new" && (
            <StatusBadge tone="info">New</StatusBadge>
          )}
        </div>

        <p className="text-sm text-muted-foreground">{req.snippet}</p>

        <div className="rounded-lg border bg-muted/40 p-4">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5" />
            Parsed by rate-ingestion microservice
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {p.lane && <Field label="Lane">{p.lane}</Field>}
            {p.shipmentType && <Field label="Shipment">{p.shipmentType}</Field>}
            {p.container && <Field label="Container">{p.container}</Field>}
            {p.rate != null && <Field label="Rate">{money(p.rate, p.currency ?? "USD")}</Field>}
            {p.validTo && <Field label="Valid to">{fmtDate(p.validTo)}</Field>}
          </div>
          {p.surcharges && p.surcharges.length > 0 && (
            <div className="mt-3 space-y-1">
              <div className="text-caption uppercase tracking-wide text-muted-foreground">Surcharges</div>
              <div className="flex flex-wrap gap-1.5">
                {p.surcharges.map((s) => (
                  <Badge key={s.code} variant="secondary" className="bg-background font-normal tabular-nums">
                    {s.code} · {money(s.amount, p.currency ?? "USD")}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">AI parse confidence</span>
            <span className={cn("font-semibold tabular-nums", confidenceTone(req.confidence))}>{pct}%</span>
          </div>
          <Progress value={pct} />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={req.status === "rejected"}
            onClick={() => onReject(req.id)}
          >
            <X className="size-4" />
            Reject
          </Button>
          <Button size="sm" disabled={req.status === "approved"} onClick={() => onApprove(req.id)}>
            <Check className="size-4" />
            Approve &amp; add to RMS
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FrontReviewPage() {
  const [statuses, setStatuses] = useState<Record<string, Status>>(() =>
    Object.fromEntries(FRONT_RATE_REQUESTS.map((r) => [r.id, r.status])),
  );

  const requests = useMemo(
    () =>
      [...FRONT_RATE_REQUESTS]
        .map((r) => ({ ...r, status: statuses[r.id] ?? r.status }))
        .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()),
    [statuses],
  );

  const counts = useMemo(() => {
    const c = { new: 0, approved: 0, rejected: 0 };
    requests.forEach((r) => { c[r.status]++; });
    return c;
  }, [requests]);

  const dupCount = useMemo(() => requests.filter((r) => findFrontDuplicates(r).length > 0).length, [requests]);

  const approve = (id: string) => {
    setStatuses((s) => ({ ...s, [id]: "approved" }));
    const r = FRONT_RATE_REQUESTS.find((x) => x.id === id);
    toast.success("Rate approved", { description: `${r?.parsed.lane ?? "Rate"} added to RMS.` });
  };
  const reject = (id: string) => {
    setStatuses((s) => ({ ...s, [id]: "rejected" }));
    toast("Rate rejected", { description: "Removed from the review queue." });
  };

  return (
    <AdminGate>
      <div className="space-y-6">
        <PageHeader
          title="Front Rate Review"
          description="Rates auto-imported from Front by the rate-ingestion microservice, proposed here for Procurement approval before they enter RMS."
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="New / pending" value={counts.new} icon={Inbox} accent="primary" />
          <StatCard label="Approved" value={counts.approved} icon={CheckCircle2} accent="success" />
          <StatCard label="Rejected" value={counts.rejected} icon={XCircle} accent="destructive" />
          <StatCard label="Duplicates flagged" value={dupCount} sub={`within ${DEDUP_WINDOW_DAYS} days`} icon={Copy} accent="warning" />
        </div>

        <div className="space-y-4">
          {requests.map((r) => (
            <ReviewCard key={r.id} req={r} onApprove={approve} onReject={reject} />
          ))}
        </div>
      </div>
    </AdminGate>
  );
}
