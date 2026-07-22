"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Users, Crown, Star, MapPin, Mail, Phone, Wrench, Database, Table2, FileWarning, ExternalLink, Pencil } from "lucide-react";
import { AdminGate } from "@/components/admin-gate";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { VENDORS, dataSourcesForVendor, ratesForVendor, RATE_TYPE_LABEL } from "@/lib/data";
import type { Vendor, VendorTier } from "@/lib/types";
import { StatusBadge, type StatusTone } from "@/components/status-badge";

const SOURCE_STATUS_TONE: Record<string, StatusTone> = {
  actual: "positive",
  on_review: "warning",
  in_edits: "warning",
  additional: "info",
  old: "neutral",
};

const SOURCE_STATUS_LABEL: Record<string, string> = {
  actual: "Actual",
  on_review: "On review",
  in_edits: "In edits",
  additional: "Additional",
  old: "Old",
};

const TIER_TONE: Record<VendorTier, StatusTone> = {
  1: "positive",
  2: "info",
  3: "neutral",
};

const ALL_COASTS = ["East", "West", "Gulf", "Inland", "Intl"] as const;

const SERVICE_LABEL: Record<string, string> = {
  trucking: "Trucking",
  rail: "Rail",
  loading: "Loading",
  disassembly: "Disassembly",
  washing: "Washing",
  fumigation: "Fumigation",
  fastening: "Fastening",
  certification: "Certification",
  tire_service: "Tire service",
  drayage: "Drayage",
  customs: "Customs",
  ocean: "Ocean",
  warehouse: "Warehouse",
  inspection: "Inspection",
  packing: "Packing",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Star className="size-4 fill-warning text-warning" />
      <span className="font-medium tabular-nums">{rating.toFixed(1)}</span>
    </span>
  );
}

function VendorRow({ vendor }: { vendor: Vendor }) {
  const sources = dataSourcesForVendor(vendor.id);
  const rates = ratesForVendor(vendor.id);
  const rateTypes = Array.from(new Set(rates.map((r) => r.type)));
  const hasSource = sources.length > 0 || rates.length > 0;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <StatusBadge tone={TIER_TONE[vendor.tier]} dot={false} className="font-semibold">
                Tier {vendor.tier}
              </StatusBadge>
              <span className="font-medium">{vendor.name}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {vendor.baseLocation}
              </span>
              <span>{vendor.coast} coast</span>
              {vendor.ownsEquipment && (
                <span className="inline-flex items-center gap-1 font-medium text-status-positive-fg">
                  <Wrench className="size-3.5" />
                  Owns equipment / crane
                </span>
              )}
            </div>
          </div>
          <Stars rating={vendor.rating} />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {vendor.services.map((s) => (
            <Badge key={s} variant="secondary" className="bg-muted font-normal text-muted-foreground">
              {SERVICE_LABEL[s] ?? s}
            </Badge>
          ))}
        </div>

        {vendor.notes && <p className="text-xs text-muted-foreground">{vendor.notes}</p>}

        {(vendor.contactEmail || vendor.contactPhone) && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {vendor.contactEmail && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="size-3.5" />
                  {vendor.contactEmail}
                </span>
              )}
              {vendor.contactPhone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="size-3.5" />
                  {vendor.contactPhone}
                </span>
              )}
            </div>
          </>
        )}

        <Separator />
        {hasSource ? (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="sources" className="border-none">
              <AccordionTrigger className="py-0 text-xs font-medium hover:no-underline">
                <span className="inline-flex items-center gap-1.5">
                  <Database className="size-3.5 text-muted-foreground" />
                  Sources &amp; rates
                  <span className="text-muted-foreground tabular-nums">
                    ({sources.length} source{sources.length === 1 ? "" : "s"} · {rates.length} rate{rates.length === 1 ? "" : "s"})
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-3 pb-0">
                <div className="space-y-3">
                  {sources.length > 0 && (
                    <ul className="space-y-1.5">
                      {sources.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <Table2 className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate font-medium">{s.name}</span>
                            {s.format && (
                              <span className="shrink-0 rounded border px-1 text-caption uppercase text-muted-foreground">
                                {s.format}
                              </span>
                            )}
                          </span>
                          <StatusBadge
                            tone={SOURCE_STATUS_TONE[s.status] ?? "neutral"}
                            className="shrink-0 font-normal"
                          >
                            {SOURCE_STATUS_LABEL[s.status] ?? s.status}
                          </StatusBadge>
                        </li>
                      ))}
                    </ul>
                  )}

                  {rates.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-muted-foreground">{rates.length} rate rows:</span>
                      {rateTypes.map((t) => (
                        <Badge key={t} variant="secondary" className="bg-muted font-normal text-muted-foreground">
                          {RATE_TYPE_LABEL[t]}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                      <Link href="/admin/rate-library">
                        <Pencil className="size-3.5" />
                        Edit rates
                      </Link>
                    </Button>
                    {sources.length > 0 && (
                      <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                        <Link href="/admin/data-sources">
                          <ExternalLink className="size-3.5" />
                          Open data source
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <FileWarning className="size-3.5 text-status-warning-fg" />
              No rate source on file — request via Front
            </span>
            <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
              <Link href="/admin/data-sources">
                <ExternalLink className="size-3.5" />
                Data sources
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function VendorsPage() {
  const [tier, setTier] = useState<string>("all");
  const [coast, setCoast] = useState<string>("all");
  const [service, setService] = useState<string>("all");

  const allServices = useMemo(
    () => Array.from(new Set(VENDORS.flatMap((v) => v.services))).sort(),
    [],
  );

  const filtered = useMemo(
    () =>
      VENDORS.filter(
        (v) =>
          (tier === "all" || String(v.tier) === tier) &&
          (coast === "all" || v.coast === coast) &&
          (service === "all" || v.services.includes(service as Vendor["services"][number])),
      ),
    [tier, coast, service],
  );

  const tier1 = VENDORS.filter((v) => v.tier === 1).length;
  const avgRating = (VENDORS.reduce((s, v) => s + v.rating, 0) / VENDORS.length).toFixed(1);

  return (
    <AdminGate>
      <div className="space-y-6">
        <PageHeader
          title="Vendors"
          description="Procurement vendor network — loading, trucking, drayage, customs and specialty services."
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vendor tiers</CardTitle>
            <CardDescription>How Atlantic ranks and allocates work across the network.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-status-positive-bg/50 p-3">
              <StatusBadge tone={TIER_TONE[1]} dot={false} className="mb-2 font-semibold">Tier 1</StatusBadge>
              <p className="text-xs text-muted-foreground">
                Owns equipment / crane, widest range of services, most reliable — gets the most shipments and the
                expensive / oversized cargo.
              </p>
            </div>
            <div className="rounded-lg border bg-status-info-bg/40 p-3">
              <StatusBadge tone={TIER_TONE[2]} dot={false} className="mb-2 font-semibold">Tier 2</StatusBadge>
              <p className="text-xs text-muted-foreground">
                Solid partners with fewer services; used where Tier 1 has no coverage or for routine lanes.
              </p>
            </div>
            <div className="rounded-lg border bg-status-neutral-bg p-3">
              <StatusBadge tone={TIER_TONE[3]} dot={false} className="mb-2 font-semibold">Tier 3</StatusBadge>
              <p className="text-xs text-muted-foreground">
                Cheapest option; loading done by drivers, no owned crane. Used to keep costs down on simpler jobs.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Total vendors" value={VENDORS.length} icon={Users} accent="primary" />
          <StatCard label="Tier 1 vendors" value={tier1} sub="Own equipment / crane" icon={Crown} accent="success" />
          <StatCard label="Avg rating" value={avgRating} sub="out of 5.0" icon={Star} accent="warning" />
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <span className="text-sm font-medium">Filter</span>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tiers</SelectItem>
                <SelectItem value="1">Tier 1</SelectItem>
                <SelectItem value="2">Tier 2</SelectItem>
                <SelectItem value="3">Tier 3</SelectItem>
              </SelectContent>
            </Select>
            <Select value={coast} onValueChange={setCoast}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Coast" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All coasts</SelectItem>
                {ALL_COASTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="Service" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                {allServices.map((s) => (
                  <SelectItem key={s} value={s}>{SERVICE_LABEL[s] ?? s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
              {filtered.length} of {VENDORS.length} vendors
            </span>
          </CardContent>
        </Card>

        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((v) => <VendorRow key={v.id} vendor={v} />)}
        </div>
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No vendors match the selected filters.</p>
        )}
      </div>
    </AdminGate>
  );
}
