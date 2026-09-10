"use client";

import Link from "next/link";
import {
  Sparkles, Calculator, ArrowRight, FileText, Briefcase, TrendingUp,
  LayoutTemplate, Pencil, Send, ExternalLink, Route,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { IconTile } from "@/components/stat-card";
import { QuoteStatusBadge } from "@/components/status-badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { useSession } from "@/components/session-provider";
import { QUOTE_HISTORY, CALC_HISTORY } from "@/lib/data/history";
import type { QuoteHistoryItem, CalcHistoryItem } from "@/lib/data/history";
import { DEALS } from "@/lib/data/deals";
import { money, fmtDate, relativeAge } from "@/lib/format";
import { reopenHref, calculatorHref } from "@/lib/quote-links";

/* ============================================================================
   Dashboard — Figma "04 - Screens / Dashboard" (77:1075).

   Everything here is composed from shared design-system components and
   tokens: Card, Table, Button, StatusBadge, IconTile, PageHeader, and the
   --c-* / semantic colour variables. No page-local colours, radii or type.
   ========================================================================= */

const QUOTE_TYPE_LABEL: Record<QuoteHistoryItem["quoteType"], string> = {
  "rate-quote": "Rate quote",
  "custom-route": "Custom route",
};

/** City without the state/country qualifier, for the narrow route columns. */
const city = (loc: string) => loc.split(",")[0].trim();

/* ── KPI card ─────────────────────────────────────────────────────────── */
function KpiCard({
  label, value, sub, icon: Icon, href,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: LucideIcon;
  href: string;
}) {
  return (
    <Link
      href={href}
      aria-label={`${label}: ${value} (${sub}) — view details`}
      className="group block rounded-card"
    >
      <Card className="h-full min-w-0 gap-2 p-4 transition-colors group-hover:border-border-strong">
        <div className="flex items-start justify-between gap-2">
          <p className="text-caption font-bold text-muted-foreground">{label}</p>
          <IconTile size="sm" className="text-primary">
            <Icon />
          </IconTile>
        </div>
        <p className="text-h2 tabular-nums text-foreground">{value}</p>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-caption text-muted-foreground">{sub}</p>
          <span className="flex shrink-0 items-center gap-1 text-caption font-medium text-primary">
            View details <ArrowRight aria-hidden className="size-3.5" />
          </span>
        </div>
      </Card>
    </Link>
  );
}

/* ── Promo card ───────────────────────────────────────────────────────── */
/* The reference draws a stroked ribbon over the gradient. It is dropped here:
   at this card's aspect ratio the 56px stroke is clipped by the card and the
   cut reads as a hard vertical line down the right edge. The gradient alone
   carries the surface. */

function PromoCard() {
  return (
    // border-0, not a transparent border: a gradient is sized to the padding
    // box but painted to the border box and repeats, so a 1px border leaves a
    // strip of the next tile — the 100% stop — down the right edge.
    <Card className="relative min-w-0 justify-end border-0 bg-[image:var(--c-promo-gradient)] bg-origin-border p-8">
      <div className="relative flex max-w-md flex-col gap-2">
        <h2 className="text-h2 text-[color:var(--c-promo-foreground)]">Need to check rates?</h2>
        <p className="text-body text-[color:var(--c-promo-muted)]">
          Check available rates using commodity-specific formulas and contract rates, or use
          custom route.
        </p>
      </div>
      <div className="relative mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/quote-master">Create rate quote</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/route-builder">Build custom route</Link>
        </Button>
      </div>
    </Card>
  );
}

/* ── Quick actions ────────────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { href: "/quote-master", label: "Create rate quote", icon: Sparkles },
  { href: "/templates", label: "Use template", icon: LayoutTemplate },
  { href: "/calculators", label: "Open calculators", icon: Calculator },
  { href: "/route-builder", label: "Build custom route", icon: Route },
];

function QuickActions() {
  return (
    <Card asChild className="p-5">
      <section aria-labelledby="quick-actions-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <h2 id="quick-actions-heading" className="text-body font-bold text-muted-foreground">
            Quick actions
          </h2>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((a) => (
              <Button key={a.href} asChild variant="outline" size="sm">
                <Link href={a.href}>
                  <a.icon aria-hidden className="size-4" /> {a.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </section>
    </Card>
  );
}

/* ── Section shell: card with a heading row and a "View all" link ─────── */
function TableSection({
  id, title, viewAllHref, viewAllLabel, children,
}: {
  id: string;
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
  children: React.ReactNode;
}) {
  return (
    // py-5 matches the 20px the table's edge cells inset by, so the heading
    // row, the rows below it and the card's own top and bottom all agree.
    <Card asChild className="gap-4 p-0 py-5">
      <section aria-labelledby={id}>
        <div className="flex items-center justify-between gap-3 px-5">
          <h2 id={id} className="text-h4 text-foreground">{title}</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href={viewAllHref} aria-label={viewAllLabel}>
              View all <ArrowRight aria-hidden className="size-4" />
            </Link>
          </Button>
        </div>
        {children}
      </section>
    </Card>
  );
}

/** Stacked presentation used below md, where nine columns cannot fit without
    forcing the page to scroll sideways. */
function MobileRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-b border-[var(--c-table-border)] px-5 py-4 last:border-b-0">
      {children}
    </li>
  );
}
function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-body text-foreground">{children}</dd>
    </>
  );
}

export default function DashboardPage() {
  const { user } = useSession();
  const firstName = user?.name.split(" ")[0] ?? "there";
  const uid = user?.id;

  // Manager's own data only
  const myQuotes = QUOTE_HISTORY.filter((q) => q.managerId === uid);
  const myCalcs = CALC_HISTORY.filter((c) => c.managerId === uid);
  const myDeals = DEALS.filter((d) => d.managerId === uid);

  const activeQuotes = myQuotes.filter((q) => q.status === "draft" || q.status === "sent");
  const activeDeals = myDeals.filter((d) => d.stage !== "Lost" && d.stage !== "Confirmed (Won)");
  const NOW = Date.now();
  const wonLast90d = myDeals.filter(
    (d) => d.stage === "Confirmed (Won)" &&
      NOW - new Date(d.closedAt ?? d.lastModified).getTime() < 90 * 86_400_000
  );
  const wonValue = wonLast90d.reduce((s, d) => s + (d.sale ?? 0), 0);

  const recentQuotes = [...myQuotes]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 5);
  const recentCalcs = [...myCalcs]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5);

  const historyHref = (params: Record<string, string>) =>
    `/history?${new URLSearchParams(uid ? { manager: uid, ...params } : params)}`;

  const quoteActions = (q: QuoteHistoryItem) => (
    <div className="flex items-center gap-1">
      {q.dealId && (
        <Button asChild variant="ghost" size="sm" className="px-2">
          <Link href={`/deals/${q.dealId}`} aria-label={`Open the deal for ${q.id}`}>
            <ExternalLink aria-hidden className="size-4" /> Deal
          </Link>
        </Button>
      )}
      <Button asChild variant="ghost" size="sm" className="px-2">
        <Link
          href={reopenHref(q)}
          aria-label={`${q.status === "sent" ? "Resend" : "Edit"} quote ${q.id}`}
        >
          {q.status === "sent" ? <Send aria-hidden className="size-4" /> : <Pencil aria-hidden className="size-4" />}
          {q.status === "sent" ? "Resend" : "Edit"}
        </Link>
      </Button>
    </div>
  );

  const calcResult = (c: CalcHistoryItem) =>
    c.unit ? c.result.toLocaleString() : money(c.result);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description={`Hello, ${firstName}! Here's where your work stands.`}
      />

      {/* 1 · Overview + promo. The KPI block and the promo sit side by side on
             wide screens, exactly as in the reference; below xl they stack. */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-label="Overview" className="grid gap-6 sm:grid-cols-2">
          <KpiCard
            label="Active quotes"
            value={activeQuotes.length}
            sub="drafts + awaiting response"
            icon={FileText}
            href={historyHref({ status: "active" })}
          />
          <KpiCard
            label="Active deals"
            value={activeDeals.length}
            sub="in your pipeline"
            icon={Briefcase}
            href="/deals"
          />
          <div className="sm:col-span-2">
            <KpiCard
              label="Won value"
              value={money(wonValue)}
              sub="last 90 days · won deals"
              icon={TrendingUp}
              href="/deals"
            />
          </div>
        </section>
        <PromoCard />
      </div>

      {/* 2 · Quick actions */}
      <QuickActions />

      {/* 3 · Recent quotes */}
      <TableSection
        id="recent-quotes-heading"
        title="Recent quotes"
        viewAllHref={historyHref({ tab: "quotes" })}
        viewAllLabel="View all quotes in History"
      >
        {recentQuotes.length === 0 ? (
          <div className="px-5">
            <EmptyState
              icon={FileText}
              title="No quotes yet"
              description="Your quotes will appear here once you create your first one."
              className="border-dashed shadow-none"
              action={
                <Button asChild size="sm">
                  <Link href="/quote-master">Create rate quote</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <>
            {/* md+ : one column per data point */}
            <div className="hidden md:block">
              <Table plain>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Quote</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead className="text-right">Client total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentQuotes.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell>
                        <Link
                          href={reopenHref(q)}
                          className="font-mono text-caption font-medium text-primary hover:underline"
                        >
                          {q.id}
                        </Link>
                      </TableCell>
                      <TableCell className="text-body text-muted-foreground">
                        {QUOTE_TYPE_LABEL[q.quoteType]}
                      </TableCell>
                      <TableCell className="max-w-56 truncate text-body">{q.customer}</TableCell>
                      <TableCell className="text-body">{city(q.origin)}</TableCell>
                      <TableCell className="text-body">{city(q.destination)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{money(q.total)}</TableCell>
                      <TableCell><QuoteStatusBadge status={q.status} /></TableCell>
                      <TableCell className="text-body text-muted-foreground">
                        <span title={fmtDate(q.updatedAt)}>{relativeAge(q.updatedAt)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">{quoteActions(q)}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* below md : the same fields, stacked, so nothing overflows */}
            <ul className="md:hidden">
              {recentQuotes.map((q) => (
                <MobileRow key={q.id}>
                  <dl className="col-span-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                    <Cell label="Quote">
                      <Link href={reopenHref(q)} className="font-mono text-caption font-medium text-primary">
                        {q.id}
                      </Link>
                    </Cell>
                    <Cell label="Type">{QUOTE_TYPE_LABEL[q.quoteType]}</Cell>
                    <Cell label="Customer">{q.customer}</Cell>
                    <Cell label="Origin">{city(q.origin)}</Cell>
                    <Cell label="Destination">{city(q.destination)}</Cell>
                    <Cell label="Client total"><span className="tabular-nums">{money(q.total)}</span></Cell>
                    <Cell label="Status"><QuoteStatusBadge status={q.status} /></Cell>
                    <Cell label="Last updated">{relativeAge(q.updatedAt)}</Cell>
                  </dl>
                  <div className="col-span-2 pt-1">{quoteActions(q)}</div>
                </MobileRow>
              ))}
            </ul>
          </>
        )}
      </TableSection>

      {/* 4 · Recent calculations — a separate table, never merged with quotes */}
      <TableSection
        id="recent-calculations-heading"
        title="Recent calculations"
        viewAllHref={historyHref({ tab: "calculations" })}
        viewAllLabel="View all calculations in History"
      >
        {recentCalcs.length === 0 ? (
          <div className="px-5">
            <EmptyState
              icon={Calculator}
              title="No calculations yet"
              description="Runs from the calculators will show up here."
              className="border-dashed shadow-none"
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href="/calculators">Open calculators</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table plain>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Calculator</TableHead>
                    <TableHead>Inputs</TableHead>
                    <TableHead className="text-right">Result</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Related quote</TableHead>
                    <TableHead>Calculated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCalcs.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.calculator}</TableCell>
                      <TableCell className="max-w-80 truncate text-body text-muted-foreground">
                        {c.summary}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{calcResult(c)}</TableCell>
                      <TableCell className="text-body text-muted-foreground">
                        {c.unit ?? <span aria-hidden>—</span>}
                        {!c.unit && <span className="sr-only">not applicable</span>}
                      </TableCell>
                      <TableCell>
                        {c.relatedQuoteId ? (
                          <Link
                            href={historyHref({ tab: "quotes", record: c.relatedQuoteId })}
                            className="font-mono text-caption font-medium text-primary hover:underline"
                          >
                            {c.relatedQuoteId}
                          </Link>
                        ) : (
                          <>
                            <span aria-hidden className="text-muted-foreground">—</span>
                            <span className="sr-only">none</span>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="text-body text-muted-foreground">
                        <span title={fmtDate(c.createdAt)}>{relativeAge(c.createdAt)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button asChild variant="ghost" size="sm" className="px-2">
                            <Link href={calculatorHref(c)} aria-label={`Open ${c.calculator}`}>
                              <Calculator aria-hidden className="size-4" /> Open
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul className="md:hidden">
              {recentCalcs.map((c) => (
                <MobileRow key={c.id}>
                  <dl className="col-span-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                    <Cell label="Calculator"><span className="font-medium">{c.calculator}</span></Cell>
                    <Cell label="Inputs">{c.summary}</Cell>
                    <Cell label="Result"><span className="tabular-nums">{calcResult(c)}</span></Cell>
                    <Cell label="Unit">{c.unit ?? "—"}</Cell>
                    <Cell label="Related quote">{c.relatedQuoteId ?? "—"}</Cell>
                    <Cell label="Calculated">{relativeAge(c.createdAt)}</Cell>
                  </dl>
                  <div className="col-span-2 pt-1">
                    <Button asChild variant="ghost" size="sm" className="px-2">
                      <Link href={calculatorHref(c)}>
                        <Calculator aria-hidden className="size-4" /> Open
                      </Link>
                    </Button>
                  </div>
                </MobileRow>
              ))}
            </ul>
          </>
        )}
      </TableSection>
    </div>
  );
}
