"use client";

import { useMemo, useState } from "react";
import { BarChart3, Award, TriangleAlert, Gauge, Timer, Crown, Star } from "lucide-react";
import { AdminGate } from "@/components/admin-gate";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VENDORS, getVendor, RATE_LIBRARY, ratesForVendor, VENDOR_INVOICES, invoiceTotals } from "@/lib/data";
import type { RateRow, RateType } from "@/lib/data";
import type { Vendor, Coast, VendorTier } from "@/lib/types";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

const TODAY = new Date("2026-06-23T00:00:00Z").getTime();
const isFresh = (r: RateRow) => r.status !== "old" && (!r.validTo || new Date(r.validTo).getTime() >= TODAY);

// Services with comparable rate rows, and the canonical unit that makes them comparable.
const SERVICE_META: { service: string; label: string; rateType: RateType; unit: string }[] = [
  { service: "loading", label: "Loading / CFS", rateType: "loading", unit: "flat" },
  { service: "trucking", label: "Trucking (inland)", rateType: "trucking", unit: "$/mile" },
  { service: "drayage", label: "Drayage", rateType: "drayage", unit: "per container" },
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

/** Report section: heading inside the card, table flush to the card's own 20px
    inset — the rhythm the Dashboard's tables set. */
function ReportCard({
  id, title, description, children,
}: {
  id: string;
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    // min-w-0: the card clips rather than scrolls, and a clip box is not a
    // scroll container, so a grid track would otherwise size itself to the
    // table's min-content width and push the card past the column.
    <Card asChild className="min-w-0 gap-4 p-0 py-5">
      <section aria-labelledby={id}>
        <div className="flex flex-col gap-1 px-5">
          <h2 id={id} className="text-h4 text-foreground">{title}</h2>
          {description && <p className="text-caption text-muted-foreground">{description}</p>}
        </div>
        {children}
      </section>
    </Card>
  );
}

export default function ReportsPage() {
  const [service, setService] = useState("loading");
  const [coast, setCoast] = useState<Coast | "all">("all");
  const [tiers, setTiers] = useState<Set<VendorTier>>(new Set([1, 2, 3]));
  const [actualOnly, setActualOnly] = useState(true);

  const meta = SERVICE_META.find((m) => m.service === service)!;

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
    const rows = VENDORS.filter((v) => v.services.includes(service as Vendor["services"][number]))
      .filter((v) => coast === "all" || v.coast === coast)
      .filter((v) => tiers.has(v.tier))
      .map((v) => {
        const rates = ratesForVendor(v.id).filter((r) => r.type === meta.rateType && r.unit === meta.unit && (!actualOnly || isFresh(r)));
        const cheapest = rates.length ? Math.min(...rates.map((r) => r.rate)) : null;
        return { vendor: v, rate: cheapest, rateCount: rates.length };
      })
      .filter((r) => r.rate != null) as { vendor: Vendor; rate: number; rateCount: number }[];
    rows.sort((a, b) => a.rate - b.rate);
    return rows;
  }, [service, coast, tiers, actualOnly, meta]);

  const minRate = ranked.length ? ranked[0].rate : 0;
  const maxRate = ranked.length ? ranked[ranked.length - 1].rate : 0;

  // ── Widget B — cheapest vendor per service ─────────────────────────────────────
  const cheapestPerService = useMemo(() =>
    SERVICE_META.map((m) => {
      const rows = VENDORS.filter((v) => v.services.includes(m.service as Vendor["services"][number]))
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

  const toggleTier = (t: VendorTier) => setTiers((s) => { const n = new Set(s); if (n.has(t)) n.delete(t); else n.add(t); return n; });
  const reset = () => { setCoast("all"); setTiers(new Set([1, 2, 3])); setActualOnly(true); };

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

            {/* Filter bar — every control full width on a phone, one row from lg up. */}
            <Card className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
                <div className="flex flex-col gap-2.5">
                  <Label htmlFor="rep-service" className="text-body font-medium text-foreground">Service</Label>
                  <Select value={service} onValueChange={setService}>
                    <SelectTrigger id="rep-service" className="w-full lg:w-56"><SelectValue /></SelectTrigger>
                    <SelectContent>{SERVICE_META.map((m) => <SelectItem key={m.service} value={m.service}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2.5">
                  <Label htmlFor="rep-coast" className="text-body font-medium text-foreground">Coast</Label>
                  <Select value={coast} onValueChange={(v) => setCoast(v as Coast | "all")}>
                    <SelectTrigger id="rep-coast" className="w-full lg:w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>{COASTS.map((c) => <SelectItem key={c} value={c}>{c === "all" ? "All coasts" : c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2.5">
                  {/* A span, not a Label: the group has three buttons, and a label
                      pointing at one of them would mislabel the other two. */}
                  <span id="rep-tier-label" className="text-body font-medium text-foreground">Tier</span>
                  <div role="group" aria-labelledby="rep-tier-label" className="flex gap-1.5">
                    {([1, 2, 3] as VendorTier[]).map((t) => (
                      <button key={t} type="button" onClick={() => toggleTier(t)} aria-pressed={tiers.has(t)}
                        className={cn(
                          "h-11 min-w-11 rounded-md border px-3.5 text-body font-medium transition-colors",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                          tiers.has(t)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border-strong text-muted-foreground hover:bg-surface-hover"
                        )}>
                        T{t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex h-11 items-center gap-2.5">
                  <Switch id="rep-actual-only" checked={actualOnly} onCheckedChange={setActualOnly} />
                  <Label htmlFor="rep-actual-only" className="text-body font-medium text-foreground">Actual rates only</Label>
                </div>
                <div className="flex h-11 items-center gap-3 lg:ml-auto">
                  <p role="status" aria-live="polite" className="text-caption text-muted-foreground">
                    {ranked.length} {ranked.length === 1 ? "vendor" : "vendors"}
                  </p>
                  <Button variant="ghost" size="sm" onClick={reset}>Reset</Button>
                </div>
              </div>
            </Card>

            {/* Widget A — ranked cost table */}
            <ReportCard
              id="report-cost-ranking"
              title={<>Vendor cost ranking — {meta.label} <span className="font-normal text-muted-foreground">({meta.unit})</span></>}
              description={`Only ${meta.unit} rates are compared, so the figures are apples-to-apples.`}
            >
              {ranked.length === 0 ? (
                <div className="px-5">
                  <EmptyState
                    icon={BarChart3}
                    title="No comparable rates"
                    description={`No ${meta.label} rates match the current filters.`}
                    className="border-dashed shadow-none"
                    action={<Button size="sm" variant="outline" onClick={reset}>Reset filters</Button>}
                  />
                </div>
              ) : (
                <Table plain>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Vendor</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Coast</TableHead>
                      <TableHead numeric>Rating</TableHead>
                      {/* The bar restates the rate column; on a phone the figures win. */}
                      <TableHead className="hidden w-40 md:table-cell">Relative cost</TableHead>
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
                          <TableCell>
                            <span className="flex items-center gap-2">
                              <span className="font-medium">{r.vendor.name}</span>
                              {i === 0 && (
                                <StatusBadge tone="positive" dot={false}>
                                  <Crown aria-hidden /> Best price
                                </StatusBadge>
                              )}
                              {i === ranked.length - 1 && ranked.length > 1 && (
                                <StatusBadge tone="warning" dot={false}>Premium</StatusBadge>
                              )}
                            </span>
                          </TableCell>
                          <TableCell><TierBadge tier={r.vendor.tier} /></TableCell>
                          <TableCell className="text-muted-foreground">{r.vendor.coast}</TableCell>
                          <TableCell numeric>
                            <span className="inline-flex items-center gap-1">
                              <Star aria-hidden className="size-3.5 fill-warning text-warning" /> {r.vendor.rating}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell"><MeterBar pct={barPct} /></TableCell>
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

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Widget B */}
              <ReportCard id="report-cheapest" title="Cheapest vendor per service">
                <Table plain>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Service</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead numeric>Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cheapestPerService.map(({ meta: m, best }) => (
                      <TableRow key={m.service}>
                        <TableCell className="text-muted-foreground">{m.label}</TableCell>
                        <TableCell className="font-medium">
                          {best ? best.v.name : <span className="font-normal text-muted-foreground">No data</span>}
                        </TableCell>
                        <TableCell numeric className="font-medium">
                          {best ? money(best.rate) : <span aria-hidden className="text-muted-foreground">—</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ReportCard>

              {/* Widget C */}
              <ReportCard
                id="report-variance"
                title="Invoice-variance leaderboard"
                description="Higher = vendor over-billed vs quoted. Feeds QuickBooks reconciliation."
              >
                <Table plain>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Vendor</TableHead>
                      <TableHead numeric>Variance</TableHead>
                      <TableHead numeric>vs quoted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {varianceBoard.map((row) => {
                      const tone = row.variance > 0 ? "text-status-negative-fg"
                        : row.variance < 0 ? "text-status-positive-fg" : "text-muted-foreground";
                      return (
                        <TableRow key={row.vid}>
                          <TableCell>{getVendor(row.vid)?.name ?? row.vid}</TableCell>
                          <TableCell numeric className={cn("font-medium", tone)}>
                            {row.variance > 0 ? "+" : ""}{money(row.variance)}
                          </TableCell>
                          <TableCell numeric className={tone}>{Math.round(row.pct * 100)}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ReportCard>
            </div>

            {/* Widget D */}
            <ReportCard
              id="report-freshness"
              title="Rate freshness by vendor"
              description="Worst coverage first — these rate sheets are the ones due a refresh."
            >
              <Table plain>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Vendor</TableHead>
                    <TableHead className="hidden w-52 sm:table-cell">Coverage</TableHead>
                    <TableHead numeric>Actual / total</TableHead>
                    <TableHead numeric>Fresh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {freshnessBoard.map(({ v, fresh, total, pct }) => (
                    <TableRow key={v.id}>
                      <TableCell>{v.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <MeterBar
                          pct={Math.max(6, pct * 100)}
                          className={pct >= 0.7 ? "bg-success" : pct >= 0.4 ? "bg-warning" : "bg-destructive"}
                        />
                      </TableCell>
                      <TableCell numeric className="text-muted-foreground">{fresh}/{total}</TableCell>
                      <TableCell numeric className="font-medium">{Math.round(pct * 100)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ReportCard>
          </TabsContent>
        </Tabs>
      </div>
    </AdminGate>
  );
}
