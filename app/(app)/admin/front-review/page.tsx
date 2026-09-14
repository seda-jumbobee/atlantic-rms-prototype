"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, X, Inbox, CheckCircle2, XCircle, Copy } from "lucide-react";
import { AdminGate } from "@/components/admin-gate";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { CarrierName } from "@/components/carrier-name";
import { CountryFlag } from "@/components/location-label";
import { DetailGrid, DetailItem } from "@/components/detail-shell";
import { EmptyState } from "@/components/empty-state";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
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

/**
 * `new` is warning, not info: an import nobody has ruled on is work waiting on
 * a person, and the status scale maps "pending review" onto warning. Warning —
 * never negative — because a rate awaiting a decision is not a failure.
 *
 * `note` is the written half of that state: what the reader is expected to do,
 * or what a decision already did. The decided notes repeat the toast wording on
 * purpose — nothing is written anywhere in this prototype, and the card should
 * not imply otherwise once the toast has gone.
 */
const STATUS: Record<Status, { tone: StatusTone; label: string; note: string }> = {
  new: {
    tone: "warning",
    label: "Awaiting review",
    note: "Action needed — approve or reject the parsed rate.",
  },
  approved: {
    tone: "positive",
    label: "Approved",
    note: "Marked approved — not written to the rate library in this development preview.",
  },
  rejected: {
    tone: "negative",
    label: "Rejected",
    note: "Marked rejected — queue state only in this development preview.",
  },
};

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
  const parsedFacts = p.rate != null || Boolean(p.validTo) || Boolean(p.shipmentType) || Boolean(p.container);
  const headingId = `${req.id}-subject`;

  return (
    <Card asChild className={cn(decided && "bg-muted/40", dupOf && "border-status-warning-border")}>
      <article aria-labelledby={headingId}>
        {/* Title, then the lane it is about, then the state — the three things
            a reviewer needs before deciding whether to read any further. */}
        <CardHeader className="gap-1.5">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            {/* basis-60: below roughly a phone's card width the chip drops to
                its own line instead of squeezing the subject into a column
                four words wide. */}
            <div className="min-w-0 flex-1 basis-60 space-y-1">
              <h3 id={headingId} className="text-h4 break-words text-foreground">
                {req.subject}
              </h3>
              {/* The lane is the parser's reading too — it is lifted out of the
                  panel below because it is what identifies the rate, and the
                  panel's confidence figure qualifies it either way. */}
              <p className="text-body text-muted-foreground">
                {p.lane ? <Lane lane={p.lane} /> : "Lane not parsed"}
              </p>
            </div>
            <StatusBadge tone={status.tone} className="shrink-0">
              {status.label}
            </StatusBadge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {dupOf && (
            <Alert variant="warning">
              <Copy aria-hidden />
              <AlertTitle>Possible duplicate request</AlertTitle>
              <AlertDescription>
                {dupBy?.name ?? "Another sales manager"} already requested the same lane and mode
                {p.shipmentType ? ` (${p.shipmentType})` : ""} {relativeAge(dupOf.receivedAt)} — inside
                the {DEDUP_WINDOW_DAYS}-day dedup window. Reuse that quote instead of re-requesting
                from the vendor.
              </AlertDescription>
            </Alert>
          )}

          {/* Who and when, as label/value pairs rather than one sentence a
              reader has to parse to find the name in it. */}
          <DetailGrid className="grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            <DetailItem label="From" className="col-span-2 sm:col-span-1">
              {req.carrierId ? (
                <CarrierName carrierId={req.carrierId} className="block" />
              ) : (
                <span className="block truncate font-medium">{vendor?.name ?? req.fromName}</span>
              )}
              <span className="block break-all text-caption text-muted-foreground">{req.fromEmail}</span>
            </DetailItem>
            <DetailItem label="Requested by">
              {requester ? (
                <span className="font-medium">{requester.name}</span>
              ) : (
                <span className="text-muted-foreground">No linked sales request</span>
              )}
            </DetailItem>
            <DetailItem label="Received">
              <span className="font-medium tabular-nums">{fmtDate(req.receivedAt)}</span>
              <span className="block text-caption text-muted-foreground">{relativeAge(req.receivedAt)}</span>
            </DetailItem>
          </DetailGrid>

          {/* The reviewer's evidence: the sender's own words, labelled and
              quoted so they are never mistaken for the parser's output. */}
          <div className="space-y-1">
            <p className="text-caption text-muted-foreground">Email excerpt</p>
            <blockquote className="border-l-2 border-[var(--c-card-border)] pl-3 text-body text-muted-foreground">
              {req.snippet}
            </blockquote>
          </div>

          <div className="rounded-lg border border-[var(--c-card-border)] bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <p className="text-caption font-medium text-muted-foreground">
                Parsed by rate-ingestion microservice
              </p>
              <div className="flex items-center gap-2">
                <span className="text-caption text-muted-foreground">Parse confidence</span>
                {/* A short meter, not a full-width rule: at this width it reads
                    as a gauge next to its figure rather than a divider cutting
                    the panel in half. */}
                <Progress
                  value={pct}
                  aria-label="Parse confidence"
                  className={cn("h-1.5 w-20", confidence.bar)}
                />
                <span className={cn("text-body font-bold tabular-nums", confidence.text)}>{pct}%</span>
              </div>
            </div>

            {parsedFacts ? (
              <DetailGrid className="mt-4 grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
                {p.rate != null && (
                  <DetailItem label="Rate">
                    <span className="font-bold tabular-nums">{money(p.rate, p.currency ?? "USD")}</span>
                  </DetailItem>
                )}
                {p.validTo && (
                  <DetailItem label="Valid to">
                    <span className="font-bold tabular-nums">{fmtDate(p.validTo)}</span>
                  </DetailItem>
                )}
                {p.shipmentType && <DetailItem label="Shipment">{p.shipmentType}</DetailItem>}
                {p.container && <DetailItem label="Container">{p.container}</DetailItem>}
              </DetailGrid>
            ) : (
              <p className="mt-4 text-body text-muted-foreground">
                No rate figures were read from this email — open it in Front before deciding.
              </p>
            )}

            {p.surcharges && p.surcharges.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <p className="text-caption text-muted-foreground">Surcharges</p>
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

          {/* What is expected of the reader, then the two controls that answer
              it. Full-width 44px targets on a phone, natural width from sm up —
              the same rule ActionBar applies, without claiming these decisions
              are the page's single primary action. */}
          <div className="flex flex-col gap-3 border-t border-[var(--c-card-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p
              className={cn(
                "text-body",
                decided ? "text-muted-foreground" : "font-medium text-foreground",
              )}
            >
              {status.note}
            </p>
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

  const waiting = counts.new > 0;

  return (
    <AdminGate>
      <div className="space-y-6">
        <PageHeader
          title="Front Rate Review"
          description="Rates auto-imported from Front by the rate-ingestion microservice, proposed here for Procurement approval before they enter RMS."
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Awaiting review" value={counts.new} icon={Inbox} accent="warning" />
          <StatCard label="Approved" value={counts.approved} icon={CheckCircle2} accent="success" />
          <StatCard label="Rejected" value={counts.rejected} icon={XCircle} accent="destructive" />
          <StatCard label="Duplicates flagged" value={dupCount} sub={`within ${DEDUP_WINDOW_DAYS} days`} icon={Copy} accent="warning" />
        </div>

        <section aria-labelledby="rate-queue-heading" className="space-y-4">
          {/* The queue is work waiting on a person, so the band that opens it
              carries the warning surface — the subtle tint and border, not a
              filled alert and never the error red. It is a section header, not
              an Alert: the heading has to be a real <h2> in the page outline.
              The tint is never the only signal — the count states the queue's
              condition in words, and it drops to the plain card surface the
              moment nothing is waiting. */}
          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-card border p-4",
              waiting
                ? "border-status-warning-border bg-status-warning-bg"
                : "border-[var(--c-card-border)] bg-card",
            )}
          >
            <div className="min-w-0">
              <h2 id="rate-queue-heading" className="text-h4 text-foreground">
                Rate queue
              </h2>
              <p role="status" aria-live="polite" className="mt-0.5 text-body text-muted-foreground">
                {waiting
                  ? `${counts.new} of ${requests.length} imports are waiting for a Procurement decision.`
                  : `All ${requests.length} imports have a decision — nothing is waiting.`}
              </p>
            </div>
            <StatusBadge tone={waiting ? "warning" : "positive"} className="shrink-0">
              {waiting ? "Requires attention" : "Up to date"}
            </StatusBadge>
          </div>

          {requests.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Nothing imported from Front"
              description="The rate-ingestion microservice has not proposed any rates yet. New vendor replies land here as they are parsed."
            />
          ) : (
            requests.map((r) => (
              <ReviewCard key={r.id} req={r} onApprove={approve} onReject={reject} />
            ))
          )}
        </section>
      </div>
    </AdminGate>
  );
}
