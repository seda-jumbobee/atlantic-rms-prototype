"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, X, Inbox, CheckCircle2, XCircle, Sparkles, Copy } from "lucide-react";
import { AdminGate } from "@/components/admin-gate";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { CarrierName } from "@/components/carrier-name";
import { CountryFlag } from "@/components/location-label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FRONT_RATE_REQUESTS, getVendor, getUser, findFrontDuplicates, DEDUP_WINDOW_DAYS } from "@/lib/data";
import { laneCountryCode } from "@/lib/quote-links";
import type { FrontRateRequest } from "@/lib/types";
import { money, fmtDate, relativeAge } from "@/lib/format";
import { cn } from "@/lib/utils";

type Status = FrontRateRequest["status"];

const STATUS: Record<Status, { tone: StatusTone; label: string }> = {
  new: { tone: "info", label: "New" },
  approved: { tone: "positive", label: "Approved" },
  rejected: { tone: "negative", label: "Rejected" },
};

/** One value the parser read — label over value, the same shape a rate card
    uses for its facts, so a parsed rate reads like any other rate here. */
function Field({
  label,
  numeric,
  children,
}: {
  label: string;
  /** Money, dates, counts — anything read down a column of figures. */
  numeric?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5 text-body font-bold text-foreground", numeric && "tabular-nums")}>
        {children}
      </dd>
    </div>
  );
}

/** A lane arrives as free text ("Baltimore → Zárate", but also "Houston CFS"
    and "US exports (all)"), so each end is flagged only where the city
    resolves to a country — the rest stay flagless rather than guess. */
function Lane({ lane }: { lane: string }) {
  const ends = lane.split("→").map((end) => end.trim());
  return (
    <span className="flex flex-wrap items-center gap-x-1.5">
      {ends.map((end, i) => (
        <span key={`${end}-${i}`} className="inline-flex items-center gap-1">
          {i > 0 && <span aria-hidden className="font-normal text-muted-foreground">→</span>}
          <CountryFlag cc={laneCountryCode(end)} />
          {end}
        </span>
      ))}
    </span>
  );
}

/** Confidence is the number that decides whether a reviewer re-reads the email
    before approving, so the bar carries the same tone as the figure instead of
    a neutral brand indigo that reads the same at 95% and at 79%. */
function confidenceTone(c: number): { text: string; bar: string } {
  if (c >= 0.9) {
    return {
      text: "text-status-positive-fg",
      bar: "*:data-[slot=progress-indicator]:bg-status-positive-fg",
    };
  }
  if (c >= 0.8) {
    return {
      text: "text-status-warning-fg",
      bar: "*:data-[slot=progress-indicator]:bg-status-warning-fg",
    };
  }
  return {
    text: "text-status-negative-fg",
    bar: "*:data-[slot=progress-indicator]:bg-status-negative-fg",
  };
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
  const status = STATUS[req.status];
  const confidence = confidenceTone(req.confidence);
  // A decided request recedes on a muted surface rather than behind opacity,
  // which would drag its text below the contrast floor.
  const decided = req.status !== "new";

  return (
    <Card
      asChild
      className={cn(decided && "bg-muted/40", dupOf && "border-status-warning-fg/30")}
    >
      <article>
        <CardContent className="space-y-4 p-4">
          {dupOf && (
            <div className="flex items-start gap-2 rounded-lg border border-status-warning-border bg-status-warning-bg p-3 text-body-sm text-status-warning-fg">
              <Copy aria-hidden className="mt-0.5 size-4 shrink-0" />
              <p>
                <b>Possible duplicate request.</b> Same lane &amp; mode ({p.lane} · {p.shipmentType})
                was already requested by <b>{dupBy?.name ?? "another sales"}</b>{" "}
                {relativeAge(dupOf.receivedAt)} — within the {DEDUP_WINDOW_DAYS}-day dedup window.
                Reuse that quote instead of re-requesting from the vendor.
              </p>
            </div>
          )}

          <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <div className="min-w-0 flex-1 space-y-1.5">
              <h3 className="text-h4 text-foreground">{req.subject}</h3>
              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                {req.carrierId ? (
                  <CarrierName carrierId={req.carrierId} />
                ) : (
                  <span className="min-w-0 truncate text-body font-medium text-foreground">
                    {vendor?.name ?? req.fromName}
                  </span>
                )}
                <span className="min-w-0 break-words text-caption text-muted-foreground">
                  {req.fromName} · {req.fromEmail}
                </span>
              </div>
              <p className="text-caption text-muted-foreground">
                {relativeAge(req.receivedAt)} · {fmtDate(req.receivedAt)}
                {requester && <> · Requested by {requester.name}</>}
              </p>
            </div>
            <StatusBadge tone={status.tone} className="shrink-0">
              {status.label}
            </StatusBadge>
          </header>

          {/* The reviewer's evidence: the sender's own words, marked as quoted
              so they are never mistaken for the parser's output below. */}
          <p className="border-l-2 border-[var(--c-card-border)] pl-3 text-body text-muted-foreground">
            {req.snippet}
          </p>

          <div className="rounded-lg border border-[var(--c-card-border)] bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5 text-caption font-medium text-muted-foreground">
                <Sparkles aria-hidden className="size-3.5" />
                Parsed by rate-ingestion microservice
              </div>
              <div className="flex items-center gap-2">
                <span className="text-caption text-muted-foreground">Parse confidence</span>
                {/* A short meter, not a full-width rule: at this width it reads
                    as a gauge next to its figure rather than a divider cutting
                    the panel in half. */}
                <Progress
                  value={pct}
                  aria-label="AI parse confidence"
                  className={cn("h-1.5 w-20", confidence.bar)}
                />
                <span className={cn("text-body font-bold tabular-nums", confidence.text)}>{pct}%</span>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {p.lane && (
                <Field label="Lane">
                  <Lane lane={p.lane} />
                </Field>
              )}
              {p.shipmentType && <Field label="Shipment">{p.shipmentType}</Field>}
              {p.container && <Field label="Container">{p.container}</Field>}
              {p.rate != null && (
                <Field label="Rate" numeric>
                  {money(p.rate, p.currency ?? "USD")}
                </Field>
              )}
              {p.validTo && (
                <Field label="Valid to" numeric>
                  {fmtDate(p.validTo)}
                </Field>
              )}
            </dl>

            {p.surcharges && p.surcharges.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <div className="text-caption text-muted-foreground">Surcharges</div>
                <div className="flex flex-wrap gap-1.5">
                  {p.surcharges.map((s) => (
                    <Badge key={s.code} variant="outline" className="font-normal tabular-nums">
                      {s.code} · {money(s.amount, p.currency ?? "USD")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Full-width 44px targets on a phone, natural width from sm up —
              the same rule ActionBar applies, without claiming these decisions
              are the page's single primary action. */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:[&_button]:w-auto sm:[&_button]:min-h-0 [&_button]:min-h-11 [&_button]:w-full">
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
      </article>
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
    // The row's status changes here and nowhere else: no rate reaches the
    // library, and a reload restores the queue. Say so rather than claiming it.
    toast("Marked approved", {
      description: `${r?.parsed.lane ?? "Rate"} — not written to the rate library in this development preview.`,
    });
  };
  const reject = (id: string) => {
    setStatuses((s) => ({ ...s, [id]: "rejected" }));
    toast("Marked rejected", { description: "Queue state only — nothing is saved in this development preview." });
  };

  return (
    <AdminGate>
      <div className="space-y-6">
        <PageHeader
          title="Front Rate Review"
          description="Rates auto-imported from Front by the rate-ingestion microservice, proposed here for Procurement approval before they enter RMS."
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="New / pending" value={counts.new} icon={Inbox} accent="primary" />
          <StatCard label="Approved" value={counts.approved} icon={CheckCircle2} accent="success" />
          <StatCard label="Rejected" value={counts.rejected} icon={XCircle} accent="destructive" />
          <StatCard label="Duplicates flagged" value={dupCount} sub={`within ${DEDUP_WINDOW_DAYS} days`} icon={Copy} accent="warning" />
        </div>

        <section className="space-y-4">
          <h2 className="text-h4 text-foreground">Review queue</h2>
          {requests.map((r) => (
            <ReviewCard key={r.id} req={r} onApprove={approve} onReject={reject} />
          ))}
        </section>
      </div>
    </AdminGate>
  );
}
