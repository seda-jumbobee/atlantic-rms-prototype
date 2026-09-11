"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Ship, Truck, Forklift, CarFront, Container, Maximize, Box, TruckElectric, Ruler,
  Plane, Timer, ShieldCheck, Landmark, Calculator, ArrowRight, Search as SearchIcon,
  ArrowUpRight, History as HistoryIcon, type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { AccentTile, accentAt, type Accent } from "@/components/accent-tile";
import { CALCULATORS, CALCULATOR_CATEGORY_LABEL, CALC_HISTORY } from "@/lib/data";
import { calculatorHref } from "@/lib/quote-links";
import { useSession } from "@/components/session-provider";
import { money, relativeAge } from "@/lib/format";
import type { CalculatorCategory, CalculatorMeta } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  Ship, Truck, Forklift, CarFront, Container, Maximize, Box, TruckElectric, Ruler, Plane, Timer, ShieldCheck, Landmark, Calculator,
};
const iconFor = (name: string) => ICONS[name] ?? Calculator;

/* Accent per calculator, keyed off its position in the full catalogue rather
   than the filtered view — so a card keeps its colour when you switch tab or
   type a search, and the unfiltered grid never repeats a hue side by side. */
const ACCENT_BY_ID: Record<string, Accent> = Object.fromEntries(
  CALCULATORS.map((c, i) => [c.id, accentAt(i)]),
);

type Tab = "all" | CalculatorCategory | "recent";
const CAT_ORDER: CalculatorCategory[] = ["freight-routing", "cargo-equipment", "costs-compliance"];
const STORAGE_KEY = "calc-hub-tab";

function searchBlob(c: CalculatorMeta): string {
  return [c.name, c.description, CALCULATOR_CATEGORY_LABEL[c.category], c.toolType === "rate-search" ? "rate search" : "calculator", c.region, c.unit]
    .filter(Boolean).join(" ").toLowerCase();
}

export default function CalculatorsPage() {
  const { user } = useSession();
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "all";
    return (sessionStorage.getItem(STORAGE_KEY) as Tab) || "all";
  });
  const [q, setQ] = useState("");

  const setTabPersist = (t: Tab) => {
    setTab(t);
    if (typeof window !== "undefined") sessionStorage.setItem(STORAGE_KEY, t);
  };

  // own recent calculations (History records — reused here for quick access, not duplicated in full)
  const recent = useMemo(
    () => CALC_HISTORY.filter((c) => !user || c.managerId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [user],
  );

  const counts = useMemo(() => ({
    all: CALCULATORS.length,
    "freight-routing": CALCULATORS.filter((c) => c.category === "freight-routing").length,
    "cargo-equipment": CALCULATORS.filter((c) => c.category === "cargo-equipment").length,
    "costs-compliance": CALCULATORS.filter((c) => c.category === "costs-compliance").length,
    recent: recent.length,
  }), [recent]);

  const query = q.trim().toLowerCase();
  const filteredCalcs = useMemo(() => {
    let out = CALCULATORS;
    if (tab !== "all" && tab !== "recent") out = out.filter((c) => c.category === tab);
    if (query) out = out.filter((c) => searchBlob(c).includes(query));
    return out;
  }, [tab, query]);

  const filteredRecent = useMemo(
    () => (query ? recent.filter((c) => `${c.calculator} ${c.summary}`.toLowerCase().includes(query)) : recent),
    [recent, query],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calculators"
        description="Estimate freight, equipment fit, shipping requirements, and additional costs."
      />

      {/* Category tabs */}
      <Tabs value={tab} onValueChange={(v) => setTabPersist(v as Tab)}>
        <div className="-mx-1 overflow-x-auto px-1">
          <TabsList>
            <TabsTrigger value="all">All <Count n={counts.all} /></TabsTrigger>
            {CAT_ORDER.map((c) => (
              <TabsTrigger key={c} value={c}>{CALCULATOR_CATEGORY_LABEL[c]} <Count n={counts[c]} /></TabsTrigger>
            ))}
            <TabsTrigger value="recent">Recent <Count n={counts.recent} /></TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Search */}
      <div className="relative w-full sm:max-w-sm">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search calculators" className="pl-8" aria-label="Search calculators" />
      </div>

      {tab === "recent" ? (
        <RecentList items={filteredRecent} hadAny={recent.length > 0} onClearSearch={() => setQ("")} searching={!!query} />
      ) : filteredCalcs.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCalcs.map((c) => <CalculatorCard key={c.id} c={c} />)}
        </div>
      ) : (
        <EmptyState
          title="No calculators found"
          description="Try another search or select a different category."
          action={<Button variant="outline" onClick={() => setQ("")}>Clear search</Button>}
        />
      )}
    </div>
  );
}

function Count({ n }: { n: number }) {
  return <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">{n}</span>;
}

function CalculatorCard({ c }: { c: CalculatorMeta }) {
  const Icon = iconFor(c.icon);
  return (
    <Link href={`/calculators/${c.id}`} className="group rounded-card outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
      <Card className="flex h-full flex-col gap-3 p-4 transition group-hover:border-primary/40 group-hover:shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <AccentTile accent={ACCENT_BY_ID[c.id]}>
            <Icon aria-hidden className="size-5" />
          </AccentTile>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {c.toolType === "rate-search" && <Badge variant="status-info" className="text-caption">Rate search</Badge>}
            <Badge variant="secondary" className="text-caption">{CALCULATOR_CATEGORY_LABEL[c.category]}</Badge>
          </div>
        </div>
        <div className="flex-1">
          <div className="font-medium leading-snug">{c.name}</div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.description}</p>
        </div>
        {/* Divider, then the action: the footer reads as a control rather than
            as one more line of the description. The arrow is present at rest —
            it is what marks the row as something you can press. */}
        <div className="flex items-center gap-1 border-t border-[var(--c-card-border)] pt-3 text-sm font-medium text-primary">
          {c.toolType === "rate-search" ? "Find rates" : "Open"}
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </Card>
    </Link>
  );
}

function RecentList({ items, hadAny, searching, onClearSearch }: { items: typeof CALC_HISTORY; hadAny: boolean; searching: boolean; onClearSearch: () => void }) {
  if (!hadAny) {
    return (
      <EmptyState
        title="No recent calculations"
        description="Completed calculations will appear here for quick access."
        action={null}
      />
    );
  }
  if (!items.length) {
    return (
      <EmptyState
        title="No calculators found"
        description="Try another search or select a different category."
        action={searching ? <Button variant="outline" onClick={onClearSearch}>Clear search</Button> : null}
      />
    );
  }
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border">
        <ul className="divide-y">
          {items.slice(0, 6).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 p-3 sm:p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium">{c.calculator}</span>
                  <Badge variant="secondary" className="text-caption">{relativeAge(c.createdAt)}</Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">{c.summary}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {(() => {
                  const isCount = /teu|slot/i.test(c.unit ?? "");
                  return (
                    <div className="text-right">
                      <div className="text-sm font-semibold tabular-nums">{isCount ? `${c.result} ${c.unit}` : money(c.result)}</div>
                      {!isCount && c.unit && <div className="text-caption text-muted-foreground">{c.unit}</div>}
                    </div>
                  );
                })()}
                <Button asChild variant="ghost" size="sm" className="gap-1">
                  <Link href={calculatorHref(c)}>Open <ArrowUpRight className="size-3.5" /></Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex justify-center">
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/history"><HistoryIcon className="size-4" /> View all history</Link>
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ title, description, action }: { title: string; description: string; action: React.ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 p-10 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground"><Calculator className="size-6" /></div>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {action && <div className="pt-1">{action}</div>}
    </Card>
  );
}
