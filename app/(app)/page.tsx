"use client";

import Link from "next/link";
import { Sparkles, Route, Calculator, Briefcase, History, ArrowRight, Ship, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuoteSearchWidget } from "@/components/quote/quote-search-widget";
import { QuoteStatusBadge } from "@/components/status-badge";
import { StatCard } from "@/components/stat-card";
import { useSession } from "@/components/session-provider";
import { QUOTE_HISTORY, CALC_HISTORY } from "@/lib/data/history";
import { DEALS } from "@/lib/data/deals";
import { money, relativeAge } from "@/lib/format";

const NAV_CARDS = [
  { href: "/route-builder", title: "Route Builder", desc: "Assemble multi-leg project-cargo routes with live totals & map.", icon: Route },
  { href: "/calculators", title: "Calculators", desc: "Shipping lines, trucking, loading, RoRo, drayage & more.", icon: Calculator },
  { href: "/deals", title: "Deals & CRM", desc: "Pipeline, margins, commissions & invoice comparison.", icon: Briefcase },
  { href: "/history", title: "History", desc: "Past quotes & calculations, ready to reopen.", icon: History },
];

export default function HomePage() {
  const { user } = useSession();
  const firstName = user?.name.split(" ")[0] ?? "there";
  const myQuotes = QUOTE_HISTORY.filter((q) => q.managerId === user?.id);
  const openQuotes = QUOTE_HISTORY.filter((q) => q.status === "draft" || q.status === "sent").length;
  const wonValue = DEALS.filter((d) => d.stage === "Confirmed (Won)").reduce((s, d) => s + (d.sale ?? 0), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Greeting */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Good day, {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground">
            Build a quote in seconds — RMS assembles inland, loading, drayage and ocean freight in one place.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open quotes" value={openQuotes} sub="drafts + sent" icon={FileText} />
        <StatCard label="Active deals" value={DEALS.filter((d) => d.stage !== "Lost" && d.stage !== "Confirmed (Won)").length} sub="in pipeline" icon={Briefcase} accent="warning" />
        <StatCard label="Won (value)" value={money(wonValue)} sub="this month" icon={TrendingUp} accent="success" />
        <StatCard label="Rate sources" value="11" sub="APIs · contracts · Front" icon={Ship} />
      </div>

      {/* Quote Master widget */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <div>
              <CardTitle>Quote Master</CardTitle>
              <CardDescription>Origin & destination, commodity, then compare live rates and stages.</CardDescription>
            </div>
            <Badge variant="secondary" className="ml-auto hidden sm:inline-flex">Master search</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <QuoteSearchWidget />
        </CardContent>
      </Card>

      {/* Nav cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {NAV_CARDS.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="group h-full p-4 transition hover:border-primary/40 hover:shadow-sm">
              <div className="grid size-10 place-items-center rounded-lg bg-muted text-primary transition group-hover:bg-primary/10">
                <c.icon className="size-5" />
              </div>
              <div className="mt-3 flex items-center gap-1 font-medium">
                {c.title}
                <ArrowRight className="size-4 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent quotes */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent quotes</h2>
            <Button variant="ghost" size="sm" asChild><Link href="/history">See all <ArrowRight className="size-4" /></Link></Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {QUOTE_HISTORY.slice(0, 4).map((q) => (
              <Card key={q.id} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{q.id}</span>
                  <QuoteStatusBadge status={q.status} />
                </div>
                <div className="mt-2 text-sm font-medium leading-tight">{q.commodity}</div>
                <div className="mt-1 text-xs text-muted-foreground">{q.origin} → {q.destination}</div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{q.shipmentType}</span>
                  <span className="font-semibold tabular-nums">{money(q.total)}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent calculations */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent calculations</h2>
          </div>
          <Card className="divide-y p-0">
            {CALC_HISTORY.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{c.calculator}</div>
                  <div className="truncate text-xs text-muted-foreground">{c.summary}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold tabular-nums">{c.unit ? c.result : money(c.result)}</div>
                  <div className="text-[10px] text-muted-foreground">{relativeAge(c.createdAt)}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
