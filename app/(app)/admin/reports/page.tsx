"use client";

import { useMemo, useState } from "react";
import { BarChart3, Award, TriangleAlert, Gauge, Timer, Crown, Star } from "lucide-react";
import { AdminGate } from "@/components/admin-gate";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function TierBadge({ tier }: { tier: VendorTier }) {
  const style = tier === 1 ? "bg-emerald-100 text-emerald-700" : tier === 2 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700";
  return <Badge variant="secondary" className={style}>T{tier}</Badge>;
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
      <div className="space-y-6">
        <PageHeader title="Reports" description="Procurement analytics — vendor pricing, invoice accuracy and rate freshness." />

        <Tabs defaultValue="vendors">
          <TabsList>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="carriers" disabled>Carriers · soon</TabsTrigger>
            <TabsTrigger value="lanes" disabled>Lanes · soon</TabsTrigger>
          </TabsList>

          <TabsContent value="vendors" className="space-y-5 pt-4">
            {/* KPI strip */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard label="Active vendors" value={kpis.activeVendors} sub="with a live rate" icon={BarChart3} />
              <StatCard label="Median loading" value={money(kpis.medLoading)} sub="per container (flat)" icon={Award} />
              <StatCard label="Avg invoice variance" value={`${(kpis.avgVar * 100).toFixed(1)}%`} sub="invoiced vs quoted" icon={TriangleAlert} accent={kpis.avgVar > 0.02 ? "warning" : "success"} />
              <StatCard label="Discrepancy rate" value={`${Math.round(kpis.discRate * 100)}%`} sub="of vendor invoices" icon={Gauge} accent={kpis.discRate > 0.25 ? "destructive" : "success"} />
              <StatCard label="Rate freshness" value={`${Math.round(kpis.freshness * 100)}%`} sub="actual, non-expired" icon={Timer} accent={kpis.freshness < 0.7 ? "warning" : "success"} />
            </div>

            {/* Filter bar */}
            <Card className="p-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Service (units must match)</Label>
                  <Select value={service} onValueChange={setService}>
                    <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>{SERVICE_META.map((m) => <SelectItem key={m.service} value={m.service}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Coast</Label>
                  <Select value={coast} onValueChange={(v) => setCoast(v as Coast | "all")}>
                    <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{COASTS.map((c) => <SelectItem key={c} value={c}>{c === "all" ? "All coasts" : c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Tier</Label>
                  <div className="flex gap-1">
                    {([1, 2, 3] as VendorTier[]).map((t) => (
                      <button key={t} type="button" onClick={() => toggleTier(t)}
                        className={cn("rounded-md border px-2.5 py-1.5 text-sm font-medium transition", tiers.has(t) ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted")}>
                        T{t}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 pb-1.5 text-sm">
                  <Switch checked={actualOnly} onCheckedChange={setActualOnly} /> Actual rates only
                </label>
                <div className="ml-auto flex items-center gap-3 pb-1.5">
                  <span className="text-xs text-muted-foreground">{ranked.length} vendors</span>
                  <Button variant="ghost" size="sm" onClick={reset}>Reset</Button>
                </div>
              </div>
            </Card>

            {/* Widget A — ranked cost table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Vendor cost ranking — {meta.label} <span className="font-normal text-muted-foreground">({meta.unit})</span></CardTitle>
              </CardHeader>
              <CardContent>
                {ranked.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No comparable {meta.label} rates for the current filters.</p>
                ) : (
                  <div className="space-y-2">
                    {ranked.map((r, i) => {
                      const delta = minRate ? Math.round(((r.rate - minRate) / minRate) * 100) : 0;
                      const barPct = maxRate ? Math.max(6, (r.rate / maxRate) * 100) : 100;
                      return (
                        <div key={r.vendor.id} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border p-2.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium">{r.vendor.name}</span>
                              <TierBadge tier={r.vendor.tier} />
                              <span className="text-xs text-muted-foreground">{r.vendor.coast}</span>
                              {i === 0 && <Badge className="gap-1 bg-success/15 text-success"><Crown className="size-3" /> Best price</Badge>}
                              {i === ranked.length - 1 && ranked.length > 1 && <Badge variant="secondary" className="bg-amber-100 text-amber-700">Premium</Badge>}
                            </div>
                            <div className="mt-1.5 h-1.5 rounded-full bg-muted">
                              <div className="h-1.5 rounded-full bg-gradient-to-r from-success to-primary" style={{ width: `${barPct}%` }} />
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold tabular-nums">{money(r.rate)} <span className="text-xs font-normal text-muted-foreground">/{meta.unit === "$/mile" ? "mi" : meta.unit === "per container" ? "cntr" : "unit"}</span></div>
                            <div className="flex items-center justify-end gap-2 text-xs">
                              <span className="inline-flex items-center gap-0.5 text-muted-foreground"><Star className="size-3 fill-amber-400 text-amber-400" /> {r.vendor.rating}</span>
                              <span className={cn("tabular-nums", delta === 0 ? "text-success" : "text-destructive")}>{delta === 0 ? "cheapest" : `+${delta}%`}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-5 lg:grid-cols-2">
              {/* Widget B */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Cheapest vendor per service</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {cheapestPerService.map(({ meta: m, best }) => (
                    <div key={m.service} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                      <span className="text-muted-foreground">{m.label}</span>
                      {best ? (
                        <span className="flex items-center gap-2"><span className="font-medium">{best.v.name}</span><span className="font-semibold tabular-nums">{money(best.rate)}</span></span>
                      ) : <span className="text-xs text-muted-foreground">no data</span>}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Widget C */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Invoice-variance leaderboard</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {varianceBoard.map((row) => (
                    <div key={row.vid} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                      <span className="truncate">{getVendor(row.vid)?.name ?? row.vid}</span>
                      <span className={cn("font-semibold tabular-nums", row.variance > 0 ? "text-destructive" : row.variance < 0 ? "text-success" : "text-muted-foreground")}>
                        {row.variance > 0 ? "+" : ""}{money(row.variance)} · {Math.round(row.pct * 100)}%
                      </span>
                    </div>
                  ))}
                  <p className="pt-1 text-[11px] text-muted-foreground">Higher = vendor over-billed vs quoted. Feeds QuickBooks reconciliation.</p>
                </CardContent>
              </Card>
            </div>

            {/* Widget D */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Rate freshness by vendor</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {freshnessBoard.map(({ v, fresh, total, pct }) => (
                  <div key={v.id} className="grid grid-cols-[1fr_auto] items-center gap-3">
                    <div>
                      <div className="flex items-center justify-between text-sm"><span>{v.name}</span><span className="text-xs text-muted-foreground">{fresh}/{total} actual</span></div>
                      <div className="mt-1 h-1.5 rounded-full bg-muted"><div className={cn("h-1.5 rounded-full", pct >= 0.7 ? "bg-success" : pct >= 0.4 ? "bg-amber-400" : "bg-destructive")} style={{ width: `${Math.max(6, pct * 100)}%` }} /></div>
                    </div>
                    <span className="w-10 text-right text-sm font-medium tabular-nums">{Math.round(pct * 100)}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Separator />
            <p className="text-center text-xs text-muted-foreground">Cost comparisons are scoped to one service &amp; unit so figures are apples-to-apples. Carriers &amp; lane analytics coming next.</p>
          </TabsContent>
        </Tabs>
      </div>
    </AdminGate>
  );
}
