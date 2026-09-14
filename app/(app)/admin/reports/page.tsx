"use client";

import { useMemo, useState } from "react";
import { BarChart3, Award, TriangleAlert, Gauge, Timer, Crown, Star } from "lucide-react";
import { AdminGate } from "@/components/admin-gate";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { FilterBar, FilterField, FilterToggleField } from "@/components/filter-bar";
import { RankedList, type RankedRow } from "@/components/ranked-list";
import { Card } from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  VENDORS, getVendor, RATE_LIBRARY, ratesForVendor, VENDOR_INVOICES, invoiceTotals,
  SERVICE_LABEL, VENDOR_TIERS,
} from "@/lib/data";
import type { RateRow, RateType } from "@/lib/data";
import type { Vendor, Coast, VendorTier, VendorServiceKind } from "@/lib/types";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

const TODAY = new Date("2026-06-23T00:00:00Z").getTime();
const isFresh = (r: RateRow) => r.status !== "old" && (!r.validTo || new Date(r.validTo).getTime() >= TODAY);

// Services with comparable rate rows, and the canonical unit that makes them
// comparable. The wording comes from the shared SERVICE_LABEL, so a service is
// never named one thing here and another on the vendor pages.
const SERVICE_META: { service: VendorServiceKind; rateType: RateType; unit: string }[] = [
  { service: "loading", rateType: "loading", unit: "flat" },
  { service: "trucking", rateType: "trucking", unit: "$/mile" },
  { service: "drayage", rateType: "drayage", unit: "per container" },
];
const COASTS: (Coast | "all")[] = ["all", "East", "West", "Gulf", "Inland", "Intl"];

/** Short form of the unit, for the head of the rate column. */
const UNIT_SHORT: Record<string, string> = { "$/mile": "mi", "per container": "cntr", flat: "unit" };

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Vendor records carry their home city in a trailing parenthesis — "JRL Heavy
    Lift (Baltimore)". Printed whole it was the widest thing on the page and
    every other column paid for it, so the city comes off the name and the
    name itself stays short. Vendors without one simply have no second part. */
function splitVendorName(name: string): [string, string | undefined] {
  const m = /^(.*?)\s*\(([^()]+)\)$/.exec(name);
  return m ? [m[1], m[2]] : [name, undefined];
}

/** Just the name, for the compact ranking modules where there is no room for
    anything beside it. */
const shortName = (name: string) => splitVendorName(name)[0];

function TierBadge({ tier }: { tier: VendorTier }) {
  const tone: StatusTone = tier === 1 ? "positive" : tier === 2 ? "info" : "neutral";
  return <StatusBadge tone={tone} dot={false}>T{tier}</StatusBadge>;
}

/** A magnitude drawn beside the figure it belongs to. Decorative: the number is
    already in the next cell, so announcing the bar as well only repeats it. */
function MeterBar({ pct, className }: { pct: number; className?: string }) {
  return (
    <span aria-hidden className="block h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <span className={cn("block h-full rounded-full bg-primary", className)} style={{ width: `${pct}%` }} />
    </span>
  );
}

/** Name on top, the metadata the table no longer spends its own column on
    underneath. The column is capped rather than left to the longest name, and
    the untruncated name stays reachable as a tooltip. */
function VendorCell({ vendor, trailing }: { vendor: Vendor; trailing?: React.ReactNode }) {
  const [name, city] = splitVendorName(vendor.name);
  return (
    <span className="flex items-center gap-2">
      {/* The caps step with the table's own column ladder, not with the
          viewport: the sidebar eats 256px, so a 768px window leaves the table
          barely 420. */}
      <span className="flex min-w-0 max-w-36 flex-col lg:max-w-52 xl:max-w-64">
        <span className="truncate font-medium" title={vendor.name}>{name}</span>
        <span className="truncate text-caption text-muted-foreground">
          {city ? `${city} · ${vendor.coast}` : vendor.coast}
        </span>
      </span>
      {trailing}
    </span>
  );
}

/** Report section: heading inside the card, table flush to the card's own 20px
    inset — the rhythm the Dashboard's tables set. */
function ReportCard({
  id, title, description, meta, children,
}: {
  id: string;
  title: React.ReactNode;
  description?: string;
  /** A live figure about what the table is showing, opposite the heading. */
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    // min-w-0: the card clips rather than scrolls, and a clip box is not a
    // scroll container, so a grid track would otherwise size itself to the
    // table's min-content width and push the card past the column.
    <Card asChild className="min-w-0 gap-4 p-0 py-5">
      <section aria-labelledby={id}>
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 px-5">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={id} className="text-h4 text-foreground">{title}</h2>
            {description && <p className="text-caption text-muted-foreground">{description}</p>}
          </div>
          {meta}
        </div>
        {children}
      </section>
    </Card>
  );
}

export default function ReportsPage() {
  const [service, setService] = useState<VendorServiceKind>("loading");
  const [coast, setCoast] = useState<Coast | "all">("all");
  const [tier, setTier] = useState<string>("all");
  const [actualOnly, setActualOnly] = useState(true);

  const meta = SERVICE_META.find((m) => m.service === service)!;
  const serviceLabel = SERVICE_LABEL[meta.service];

  // ── KPI strip ────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const activeVendors = VENDORS.filter((v) => ratesForVendor(v.id).some(isFresh)).length;
    const loadingFlat = RATE_LIBRARY.filter((r) => r.type === "loading" && r.unit === "flat").map((r) => r.rate);
    const medLoading = median(loadingFlat);
    const variances = VENDOR_INVOICES.map((inv) => { const t = invoiceTotals(inv); return t.quoted ? t.variance / t.quoted : 0; });
    const avgVar = variances.length ? variances.reduce((s, v) => s + v, 0) / variances.length : 0;
    const discRate = VENDOR_INVOICES.length ? VENDOR_INVOICES.filter((i) => i.status === "discrepancy").length / VENDOR_INVOICES.length : 0;
    const allVendorRates = VENDORS.flatMap((v) => ratesForVendor(v.id));
    const freshness = allVendorRates.length ? allVendorRates.filter(isFresh).length / allVendorRates.length : 0;
    return { activeVendors, medLoading, avgVar, discRate, freshness };
  }, []);

  // ── Widget A — ranked vendor cost table for the selected service ───────────────
  const ranked = useMemo(() => {
    const rows = VENDORS.filter((v) => v.services.includes(service))
      .filter((v) => coast === "all" || v.coast === coast)
      .filter((v) => tier === "all" || String(v.tier) === tier)
      .map((v) => {
        const rates = ratesForVendor(v.id).filter((r) => r.type === meta.rateType && r.unit === meta.unit && (!actualOnly || isFresh(r)));
        const cheapest = rates.length ? Math.min(...rates.map((r) => r.rate)) : null;
        return { vendor: v, rate: cheapest, rateCount: rates.length };
      })
      .filter((r) => r.rate != null) as { vendor: Vendor; rate: number; rateCount: number }[];
    rows.sort((a, b) => a.rate - b.rate);
    return rows;
  }, [service, coast, tier, actualOnly, meta]);

  const minRate = ranked.length ? ranked[0].rate : 0;
  const maxRate = ranked.length ? ranked[ranked.length - 1].rate : 0;

  // ── Widget B — cheapest vendor per service ─────────────────────────────────────
  const cheapestPerService = useMemo(() =>
    SERVICE_META.map((m) => {
      const rows = VENDORS.filter((v) => v.services.includes(m.service))
        .map((v) => { const rs = ratesForVendor(v.id).filter((r) => r.type === m.rateType && r.unit === m.unit && isFresh(r)); return rs.length ? { v, rate: Math.min(...rs.map((r) => r.rate)) } : null; })
        .filter(Boolean) as { v: Vendor; rate: number }[];
      rows.sort((a, b) => a.rate - b.rate);
      return { meta: m, best: rows[0] };
    }), []);

  // ── Widget C — invoice-variance leaderboard (per vendor) ──────────────────────
  const varianceBoard = useMemo(() => {
    const byVendor = new Map<string, { quoted: number; invoiced: number }>();
    VENDOR_INVOICES.forEach((inv) => inv.lines.forEach((l) => {
      const vid = l.vendorId ?? inv.vendorId;
      const cur = byVendor.get(vid) ?? { quoted: 0, invoiced: 0 };
      cur.quoted += l.quoted; cur.invoiced += l.invoiced;
      byVendor.set(vid, cur);
    }));
    return [...byVendor.entries()]
      .map(([vid, t]) => ({ vid, ...t, variance: t.invoiced - t.quoted, pct: t.quoted ? (t.invoiced - t.quoted) / t.quoted : 0 }))
      .sort((a, b) => b.variance - a.variance);
  }, []);

  // ── Widget D — rate freshness per vendor ──────────────────────────────────────
  const freshnessBoard = useMemo(() =>
    VENDORS.map((v) => { const rs = ratesForVendor(v.id); const fresh = rs.filter(isFresh).length; return { v, total: rs.length, fresh, pct: rs.length ? fresh / rs.length : 0 }; })
      .filter((x) => x.total > 0)
      .sort((a, b) => a.pct - b.pct), []);

  // The three boards were ordered tables that never said they were ranked, so
  // they now go through the shared RankedList: rank, vendor, the one figure the
  // order is by. At a third of the page there is room for nothing else, so the
  // second and third columns each survive only as a short note.
  const cheapestRows: RankedRow[] = cheapestPerService.map(({ meta: m, best }) => ({
    id: m.service,
    label: best ? shortName(best.v.name) : "No vendor with a live rate",
    note: SERVICE_LABEL[m.service],
    metric: best ? money(best.rate) : <span aria-hidden className="font-normal text-muted-foreground">—</span>,
  }));

  const varianceRows: RankedRow[] = varianceBoard.map((row) => {
    const vendor = getVendor(row.vid);
    const tone = row.variance > 0 ? "text-status-negative-fg"
      : row.variance < 0 ? "text-status-positive-fg" : "text-muted-foreground";
    return {
      id: row.vid,
      label: vendor ? shortName(vendor.name) : row.vid,
      note: `${row.pct > 0 ? "+" : ""}${Math.round(row.pct * 100)}%`,
      metric: <span className={tone}>{row.variance > 0 ? "+" : ""}{money(row.variance)}</span>,
    };
  });

  const freshnessRows: RankedRow[] = freshnessBoard.map(({ v, fresh, total, pct }) => ({
    id: v.id,
    label: shortName(v.name),
    // Bare "1/1" rather than "1/1 actual": the percentage beside it already
    // names what the fraction is, and the words were the first thing the row
    // truncated away at three-across.
    note: `${fresh}/${total}`,
    metric: (
      <span className={pct >= 0.7 ? "text-status-positive-fg" : pct >= 0.4 ? "text-status-warning-fg" : "text-status-negative-fg"}>
        {Math.round(pct * 100)}%
      </span>
    ),
  }));

  const activeFilters = (coast !== "all" ? 1 : 0) + (tier !== "all" ? 1 : 0) + (actualOnly ? 0 : 1);
  // Service is the dimension the table reports on rather than a narrowing of
  // it, so reset leaves it where the user put it.
  const reset = () => { setCoast("all"); setTier("all"); setActualOnly(true); };

  return (
    <AdminGate>
      <div className="flex flex-col gap-6">
        <PageHeader title="Reports" description="Procurement analytics — vendor pricing, invoice accuracy and rate freshness." />

        <Tabs defaultValue="vendors">
          {/* The tab strip scrolls itself on a phone rather than widening the page. */}
          <div className="-mx-1 overflow-x-auto px-1">
            <TabsList>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
              <TabsTrigger value="carriers" disabled>Carriers · soon</TabsTrigger>
              <TabsTrigger value="lanes" disabled>Lanes · soon</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="vendors" className="flex flex-col gap-6 pt-4">
            {/* KPI strip */}
            <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <StatCard label="Active vendors" value={kpis.activeVendors} sub="with a live rate" icon={BarChart3} />
              <StatCard label="Median loading" value={money(kpis.medLoading)} sub="per container (flat)" icon={Award} />
              <StatCard label="Avg invoice variance" value={`${(kpis.avgVar * 100).toFixed(1)}%`} sub="invoiced vs quoted" icon={TriangleAlert} accent={kpis.avgVar > 0.02 ? "warning" : "success"} />
              <StatCard label="Discrepancy rate" value={`${Math.round(kpis.discRate * 100)}%`} sub="of vendor invoices" icon={Gauge} accent={kpis.discRate > 0.25 ? "destructive" : "success"} />
              <StatCard label="Rate freshness" value={`${Math.round(kpis.freshness * 100)}%`} sub="actual, non-expired" icon={Timer} accent={kpis.freshness < 0.7 ? "warning" : "success"} />
            </section>

            {/* The filters drive the cost ranking and nothing below it, so the
                two sit together as one unit rather than a page apart. */}
            <div className="flex flex-col gap-3">
              <FilterBar onReset={reset} activeCount={activeFilters}>
                <FilterField label="Service" htmlFor="rep-service">
                  <Select value={service} onValueChange={(v) => setService(v as VendorServiceKind)}>
                    <SelectTrigger id="rep-service" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_META.map((m) => (
                        <SelectItem key={m.service} value={m.service}>{SERVICE_LABEL[m.service]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterField>

                <FilterField label="Coast" htmlFor="rep-coast">
                  <Select value={coast} onValueChange={(v) => setCoast(v as Coast | "all")}>
                    <SelectTrigger id="rep-coast" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COASTS.map((c) => <SelectItem key={c} value={c}>{c === "all" ? "All coasts" : c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FilterField>

                <FilterField label="Tier" htmlFor="rep-tier">
                  <Select value={tier} onValueChange={setTier}>
                    <SelectTrigger id="rep-tier" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tiers</SelectItem>
                      {VENDOR_TIERS.map((t) => (
                        <SelectItem key={t} value={String(t)}>Tier {t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterField>

                <FilterToggleField label="Actual rates only" htmlFor="rep-actual-only">
                  <Switch id="rep-actual-only" checked={actualOnly} onCheckedChange={setActualOnly} />
                </FilterToggleField>
              </FilterBar>

              {/* Widget A — ranked cost table */}
              <ReportCard
                id="report-cost-ranking"
                title={<>Vendor cost ranking — {serviceLabel} <span className="font-normal text-muted-foreground">({meta.unit})</span></>}
                description={`Cheapest first. Only ${meta.unit} rates are compared, so the figures are apples-to-apples.`}
                meta={
                  <p role="status" aria-live="polite" className="text-caption text-muted-foreground tabular-nums">
                    {ranked.length} {ranked.length === 1 ? "vendor" : "vendors"}
                  </p>
                }
              >
                {ranked.length === 0 ? (
                  <div className="px-5">
                    <EmptyState
                      icon={BarChart3}
                      title="No comparable rates"
                      description={`No ${serviceLabel} rates match the current filters.`}
                      className="border-dashed shadow-none"
                      action={<Button size="sm" variant="outline" onClick={reset}>Reset filters</Button>}
                    />
                  </div>
                ) : (
                  <Table plain>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead numeric className="w-10">
                          <span aria-hidden>#</span>
                          <span className="sr-only">Rank</span>
                        </TableHead>
                        {/* Coast rides along under the vendor name — a column of
                            five short words was not worth the width it cost. */}
                        <TableHead>Vendor</TableHead>
                        {/* Priority order, widest first: the rate and the delta
                            are the report, so tier, rating and the bar drop off
                            in that order as the column narrows. */}
                        <TableHead className="hidden sm:table-cell">Tier</TableHead>
                        <TableHead numeric className="hidden lg:table-cell">Rating</TableHead>
                        {/* The bar only restates the rate column. */}
                        <TableHead className="hidden w-32 xl:table-cell">Relative cost</TableHead>
                        <TableHead numeric>Rate / {UNIT_SHORT[meta.unit] ?? meta.unit}</TableHead>
                        <TableHead numeric>vs cheapest</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ranked.map((r, i) => {
                        const delta = minRate ? Math.round(((r.rate - minRate) / minRate) * 100) : 0;
                        const barPct = maxRate ? Math.max(6, (r.rate / maxRate) * 100) : 100;
                        return (
                          <TableRow key={r.vendor.id}>
                            <TableCell
                              numeric
                              className={cn("text-caption", i < 3 ? "font-bold text-foreground" : "text-muted-foreground")}
                            >
                              {i + 1}
                            </TableCell>
                            <TableCell>
                              <VendorCell
                                vendor={r.vendor}
                                trailing={
                                  // Below lg both chips stand down. A chip costs
                                  // ~100px inside the one cell that has to hold
                                  // a name, and the rank column plus the green
                                  // "cheapest" / red "+N%" already say which end
                                  // of the list a row sits at.
                                  <>
                                    {i === 0 && (
                                      <StatusBadge tone="positive" dot={false} className="hidden shrink-0 lg:inline-flex">
                                        <Crown aria-hidden /> Best price
                                      </StatusBadge>
                                    )}
                                    {i === ranked.length - 1 && ranked.length > 1 && (
                                      <StatusBadge tone="warning" dot={false} className="hidden shrink-0 lg:inline-flex">
                                        Premium
                                      </StatusBadge>
                                    )}
                                  </>
                                }
                              />
                            </TableCell>
                            <TableCell className="hidden sm:table-cell"><TierBadge tier={r.vendor.tier} /></TableCell>
                            <TableCell numeric className="hidden lg:table-cell">
                              <span className="inline-flex items-center gap-1">
                                <Star aria-hidden className="size-3.5 fill-warning text-warning" /> {r.vendor.rating}
                              </span>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell"><MeterBar pct={barPct} /></TableCell>
                            <TableCell numeric className="font-medium">{money(r.rate)}</TableCell>
                            <TableCell numeric className={cn(delta === 0 ? "text-status-positive-fg" : "text-status-negative-fg")}>
                              {delta === 0 ? "cheapest" : `+${delta}%`}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </ReportCard>
            </div>

            {/* Three compact league tables — three across on a wide desktop, two
                once the content column narrows, one on a phone. */}
            <section aria-labelledby="report-rankings" className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <h2 id="report-rankings" className="sr-only">Vendor rankings</h2>

              {/* The three lines are one winner each, not one league table:
                  loading is a flat rate, trucking is per mile, drayage is per
                  container. The description says so, because the numbered rows
                  would otherwise invite reading $3 as beating $700. */}
              <RankedList
                title="Cheapest vendor per service"
                description="One winner per service — each in its own unit, not one league table."
                rows={cheapestRows}
                emptyLabel="No service has a live rate yet."
              />

              <RankedList
                title="Invoice-variance leadership"
                description="Biggest over-billing first — invoiced against quoted."
                rows={varianceRows}
                emptyLabel="No vendor invoices to compare."
              />

              <RankedList
                title="Rate freshness by vendor"
                description="Worst coverage first — the rate sheets due a refresh."
                rows={freshnessRows}
                emptyLabel="No vendor has rates on file."
              />
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </AdminGate>
  );
}
