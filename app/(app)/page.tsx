"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles, Calculator, ArrowRight, FileText, Briefcase, TrendingUp,
  AlertCircle, LayoutTemplate, Ship, MapPin, Pencil, Send, ExternalLink, Route,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { IconTile } from "@/components/stat-card";
import { QuoteStatusBadge, StatusBadge } from "@/components/status-badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { useSession } from "@/components/session-provider";
import { QUOTE_HISTORY, CALC_HISTORY } from "@/lib/data/history";
import { DEALS } from "@/lib/data/deals";
import { money, fmtDate, relativeAge } from "@/lib/format";
import { reopenHref, calculatorHref, needsAttention } from "@/lib/quote-links";
import { cn } from "@/lib/utils";

/* Fully clickable overview card: main number, supporting label,
   tertiary "View details", hover/focus/keyboard states. */
function OverviewCard({
  label, value, sub, icon: Icon, accent, href,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: LucideIcon;
  accent?: "success" | "warning" | "destructive";
  href: string;
}) {
  const accentColor =
    accent === "success" ? "text-success" : accent === "warning" ? "text-warning"
    : accent === "destructive" ? "text-destructive" : "text-primary";
  return (
    <Link
      href={href}
      aria-label={`${label}: ${value} (${sub}) — view details`}
      className="group rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <Card className="h-full min-w-0 gap-1 p-4 transition group-hover:border-primary/40 group-hover:shadow-sm group-focus-visible:border-ring">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <IconTile size="sm" className={accentColor}>
            <Icon />
          </IconTile>
        </div>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-muted-foreground">{sub}</p>
          <span className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
            View details <ArrowRight className="size-3.5" />
          </span>
        </div>
      </Card>
    </Link>
  );
}

/* Minimal route graphic for the hero — origin → ocean leg → destination. */
function RouteGraphic() {
  return (
    <div aria-hidden className="hidden shrink-0 select-none md:block">
      <div className="flex items-center gap-2 rounded-xl border bg-card px-5 py-4 shadow-xs">
        <div className="flex flex-col items-center gap-1">
          <span className="grid size-8 place-items-center rounded-full bg-accent text-accent-foreground">
            <MapPin className="size-4" />
          </span>
          <span className="text-caption text-muted-foreground">Origin</span>
        </div>
        <span className="h-px w-8 border-t border-dashed border-muted-foreground/40" />
        <div className="flex flex-col items-center gap-1">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
            <Ship className="size-4" />
          </span>
          <span className="text-caption text-muted-foreground">Ocean</span>
        </div>
        <span className="h-px w-8 border-t border-dashed border-muted-foreground/40" />
        <div className="flex flex-col items-center gap-1">
          <span className="grid size-8 place-items-center rounded-full bg-accent text-accent-foreground">
            <MapPin className="size-4" />
          </span>
          <span className="text-caption text-muted-foreground">Door</span>
        </div>
      </div>
      <p className="mt-2 text-center text-caption text-muted-foreground">
        Inland · loading · drayage · ocean — in one quote
      </p>
    </div>
  );
}

const QUICK_ACTIONS = [
  { href: "/quote-master", label: "Create rate quote", icon: Sparkles },
  { href: "/templates", label: "Use template", icon: LayoutTemplate },
  { href: "/calculators", label: "Open calculators", icon: Calculator },
];

export default function DashboardPage() {
  const { user } = useSession();
  const router = useRouter();
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
  const attentionQuotes = myQuotes.filter((q) => needsAttention(q, NOW));

  const recentQuotes = [...myQuotes]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5);
  const recentCalcs = [...myCalcs]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 4);

  const historyHref = (params: Record<string, string>) =>
    `/history?${new URLSearchParams(uid ? { manager: uid, ...params } : params)}`;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Good day, ${firstName} — here's where your work stands.`}
      />

      {/* 1 · Overview */}
      <section aria-label="Overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          label="Active quotes"
          value={activeQuotes.length}
          sub="drafts + awaiting response"
          icon={FileText}
          href={historyHref({ status: "active" })}
        />
        <OverviewCard
          label="Active deals"
          value={activeDeals.length}
          sub="in your pipeline"
          icon={Briefcase}
          href="/deals"
        />
        <OverviewCard
          label="Won value"
          value={money(wonValue)}
          sub="last 90 days · won deals"
          icon={TrendingUp}
          accent="success"
          href="/deals"
        />
        <OverviewCard
          label="Quotes requiring attention"
          value={attentionQuotes.length}
          sub="drafts · stale · expired"
          icon={AlertCircle}
          accent={attentionQuotes.length > 0 ? "warning" : undefined}
          href={historyHref({ status: "attention" })}
        />
      </section>

      {/* 2 · Create a new quote (hero) */}
      <section aria-label="Create a new quote">
        <Card className="border-primary/20">
          <CardContent className="flex flex-col items-start gap-6 p-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">Create a new quote</h2>
              <p className="text-sm text-muted-foreground">
                Find available rates for a commodity-based quote or manually build a custom route.
              </p>
              <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:gap-6">
                <div className="space-y-1.5">
                  <Button asChild size="lg">
                    <Link href="/quote-master">
                      <Sparkles className="size-4" /> Create rate quote
                    </Link>
                  </Button>
                  <p className="text-caption text-muted-foreground">
                    Use commodity formulas and available contract rates.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Button asChild variant="outline" size="lg">
                    <Link href="/route-builder">
                      <Route className="size-4" /> Build custom route
                    </Link>
                  </Button>
                  <p className="text-caption text-muted-foreground">
                    Select transportation stages, vendors, and contracts manually.
                  </p>
                </div>
              </div>
            </div>
            <RouteGraphic />
          </CardContent>
        </Card>
      </section>

      {/* 3 · Quick actions */}
      <section aria-label="Quick actions" className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((a) => (
            <Button key={a.href} asChild variant="outline" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link href={a.href}>
                <a.icon className="size-4" /> {a.label}
              </Link>
            </Button>
          ))}
        </div>
      </section>

      {/* 4 · Needs attention */}
      {attentionQuotes.length > 0 && (
        <section aria-label="Needs attention" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Needs attention</h2>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href={historyHref({ status: "attention" })}>
                View all <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <Card className="divide-y p-0">
            {attentionQuotes.slice(0, 4).map((q) => {
              const stale = q.status === "sent";
              return (
                <div key={q.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 sm:flex-nowrap">
                  <StatusBadge tone={q.status === "draft" ? "neutral" : "warning"} className="shrink-0">
                    {q.status === "draft" ? "Draft" : q.status === "expired" ? "Expired" : "No response"}
                  </StatusBadge>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium">{q.commodity}</span>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">{q.id}</span>
                    <div className="truncate text-xs text-muted-foreground">
                      {q.customer} · {stale
                        ? `sent ${relativeAge(q.createdAt)}, no response`
                        : `created ${relativeAge(q.createdAt)}, not sent`}
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="ml-auto shrink-0">
                    <Link href={reopenHref(q)}>
                      {stale ? <Send className="size-4" /> : <Pencil className="size-4" />}
                      {stale ? "Resend" : "Edit & send"}
                    </Link>
                  </Button>
                </div>
              );
            })}
          </Card>
        </section>
      )}

      {/* 5 · Recent activity */}
      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Recent quotes */}
        <section aria-label="Recent quotes" className="min-w-0 space-y-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent quotes</h2>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href={historyHref({})}>
                View all <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          {recentQuotes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No quotes yet"
              description="Your quotes will appear here once you create your first one."
              action={
                <Button asChild size="sm">
                  <Link href="/quote-master">Create rate quote</Link>
                </Button>
              }
            />
          ) : (
            <Card className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead className="text-right">Client total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentQuotes.map((q) => (
                    <TableRow
                      key={q.id}
                      className="cursor-pointer"
                      onClick={() => router.push(reopenHref(q))}
                    >
                      <TableCell>
                        <Link
                          href={reopenHref(q)}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-xs font-medium text-primary outline-none hover:underline focus-visible:underline"
                        >
                          {q.id}
                        </Link>
                        <div className="max-w-[14rem] truncate text-xs text-muted-foreground">{q.customer}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {q.origin.split(",")[0]}
                        <span className="text-muted-foreground"> → </span>
                        {q.destination.split(",")[0]}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{money(q.total)}</TableCell>
                      <TableCell><QuoteStatusBadge status={q.status} /></TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        <span title={fmtDate(q.createdAt)}>{relativeAge(q.createdAt)}</span>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {q.dealId && (
                            <Button asChild variant="ghost" size="sm" className="h-8 px-2">
                              <Link href={`/deals/${q.dealId}`}>
                                <ExternalLink className="size-4" /> Deal
                              </Link>
                            </Button>
                          )}
                          <Button asChild variant="ghost" size="sm" className="h-8 px-2">
                            <Link href={reopenHref(q)}>
                              <Pencil className="size-4" />
                              {q.status === "sent" ? "Resend" : "Edit"}
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </section>

        {/* Recent calculations */}
        <section aria-label="Recent calculations" className="min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent calculations</h2>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href={historyHref({ tab: "calculations" })}>
                View all <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          {recentCalcs.length === 0 ? (
            <EmptyState
              icon={Calculator}
              title="No calculations yet"
              description="Runs from the calculators will show up here."
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href="/calculators">Open calculators</Link>
                </Button>
              }
            />
          ) : (
            <Card className="divide-y p-0">
              {recentCalcs.map((c) => (
                <Link
                  key={c.id}
                  href={calculatorHref(c)}
                  className={cn(
                    "flex items-start justify-between gap-3 p-3 outline-none transition",
                    "hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50",
                    "first:rounded-t-xl last:rounded-b-xl"
                  )}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{c.calculator}</div>
                    <div className="truncate text-xs text-muted-foreground">{c.summary}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold tabular-nums">
                      {c.unit ? c.result : money(c.result)}
                    </div>
                    <div className="text-caption text-muted-foreground" title={fmtDate(c.createdAt)}>
                      {relativeAge(c.createdAt)}
                    </div>
                  </div>
                </Link>
              ))}
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
