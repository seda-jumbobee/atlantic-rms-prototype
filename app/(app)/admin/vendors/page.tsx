"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Users, Crown, Star, MapPin, Mail, Phone, Wrench, Database, Table2,
  FileWarning, ExternalLink, Pencil, RotateCcw,
} from "lucide-react";
import { AdminGate } from "@/components/admin-gate";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { VENDORS, dataSourcesForVendor, ratesForVendor, RATE_TYPE_LABEL } from "@/lib/data";
import type { Coast, Vendor, VendorTier } from "@/lib/types";

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

const TIER_GUIDE: { tier: VendorTier; description: string }[] = [
  {
    tier: 1,
    description:
      "Owns equipment / crane, widest range of services, most reliable — gets the most shipments and the expensive / oversized cargo.",
  },
  {
    tier: 2,
    description:
      "Solid partners with fewer services; used where Tier 1 has no coverage or for routine lanes.",
  },
  {
    tier: 3,
    description:
      "Cheapest option; loading done by drivers, no owned crane. Used to keep costs down on simpler jobs.",
  },
];

const ALL_COASTS = ["East", "West", "Gulf", "Inland", "Intl"] as const;

/** The stored value spelled out: "Intl coast" and "Inland coast" are not
    things, so the region reads as its own phrase rather than as `${coast} coast`.
    Filter values stay the raw `Coast`, so nothing about matching changes. */
const COAST_LABEL: Record<Coast, string> = {
  East: "East coast",
  West: "West coast",
  Gulf: "Gulf coast",
  Inland: "Inland",
  Intl: "International",
};

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

/** A filter group: 14px title, 10px, control — the spacing the rate filters
    settled on, so every filter group in the product reads the same. */
function FilterField({
  id, label, children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <Label htmlFor={id} className="mb-2.5 block text-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Rating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-body">
      <Star aria-hidden className="size-4 fill-warning text-warning" />
      <span className="font-medium tabular-nums">{value.toFixed(1)}</span>
      <span className="sr-only">out of 5</span>
    </span>
  );
}

function VendorCard({ vendor }: { vendor: Vendor }) {
  const sources = dataSourcesForVendor(vendor.id);
  const rates = ratesForVendor(vendor.id);
  const rateTypes = Array.from(new Set(rates.map((r) => r.type)));
  const hasSource = sources.length > 0 || rates.length > 0;

  return (
    <Card className="h-full">
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <h3 className="text-h4m text-foreground">{vendor.name}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin aria-hidden className="size-3.5 shrink-0" />
                {vendor.baseLocation}
              </span>
              <span>{COAST_LABEL[vendor.coast]}</span>
              {vendor.ownsEquipment && (
                <span className="inline-flex items-center gap-1 font-medium text-status-positive-fg">
                  <Wrench aria-hidden className="size-3.5 shrink-0" />
                  Owns equipment / crane
                </span>
              )}
            </div>
          </div>
          {/* Tier and rating stack to the right so the name keeps the first
              read and the two comparable figures line up down the column. */}
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <StatusBadge tone={TIER_TONE[vendor.tier]} dot={false}>Tier {vendor.tier}</StatusBadge>
            <Rating value={vendor.rating} />
          </div>
        </div>

        <ul className="flex flex-wrap gap-1.5">
          {vendor.services.map((s) => (
            <li key={s}>
              <Badge variant="secondary">{SERVICE_LABEL[s] ?? s}</Badge>
            </li>
          ))}
        </ul>

        {vendor.notes && <p className="text-body-sm text-muted-foreground">{vendor.notes}</p>}

        {(vendor.contactEmail || vendor.contactPhone) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-caption">
            {vendor.contactEmail && (
              <a
                href={`mailto:${vendor.contactEmail}`}
                className="inline-flex min-w-0 items-center gap-1.5 py-0.5 font-medium text-primary hover:underline"
              >
                <Mail aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{vendor.contactEmail}</span>
              </a>
            )}
            {vendor.contactPhone && (
              <a
                // Dial strings keep only digits and a leading +; the printed
                // form stays as procurement recorded it.
                href={`tel:${vendor.contactPhone.replace(/[^\d+]/g, "")}`}
                className="inline-flex items-center gap-1.5 py-0.5 font-medium text-primary hover:underline"
              >
                <Phone aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
                {vendor.contactPhone}
              </a>
            )}
          </div>
        )}

        {/* Sources sit at the foot of the card, so in a two-column grid the
            disclosures line up with each other instead of with the notes. */}
        <div className="mt-auto flex flex-col pt-1">
          <Separator />
          {hasSource ? (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="sources" className="border-none">
                <AccordionTrigger className="min-h-11 items-center hover:no-underline">
                  <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="inline-flex items-center gap-1.5">
                      <Database aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                      Sources &amp; rates
                    </span>
                    <span className="text-caption font-normal text-muted-foreground tabular-nums">
                      {sources.length} source{sources.length === 1 ? "" : "s"} · {rates.length} rate
                      {rates.length === 1 ? "" : "s"}
                    </span>
                  </span>
                </AccordionTrigger>
                {/* The shared content block underlines every descendant link,
                    which turns the buttons below into underlined text. */}
                <AccordionContent className="pt-0 pb-1 [&_a]:no-underline">
                  <div className="flex flex-col gap-3">
                    {sources.length > 0 && (
                      <ul className="flex flex-col gap-1.5">
                        {sources.map((s) => (
                          <li
                            key={s.id}
                            className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-caption"
                          >
                            <span className="inline-flex min-w-0 items-center gap-1.5">
                              <Table2 aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
                              <span className="truncate font-medium">{s.name}</span>
                              {s.format && (
                                <Badge variant="outline" className="shrink-0 uppercase">
                                  {s.format}
                                </Badge>
                              )}
                            </span>
                            <StatusBadge
                              tone={SOURCE_STATUS_TONE[s.status] ?? "neutral"}
                              className="shrink-0"
                            >
                              {SOURCE_STATUS_LABEL[s.status] ?? s.status}
                            </StatusBadge>
                          </li>
                        ))}
                      </ul>
                    )}

                    {rates.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-caption text-muted-foreground tabular-nums">
                          {rates.length} rate row{rates.length === 1 ? "" : "s"}
                        </span>
                        {rateTypes.map((t) => (
                          <Badge key={t} variant="secondary">{RATE_TYPE_LABEL[t]}</Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href="/admin/rate-library">
                          <Pencil aria-hidden />
                          Edit rates
                        </Link>
                      </Button>
                      {sources.length > 0 && (
                        <Button asChild size="sm" variant="ghost">
                          <Link href="/admin/data-sources">
                            <ExternalLink aria-hidden />
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
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
              <span className="inline-flex min-w-0 items-center gap-1.5 text-caption font-medium text-status-warning-fg">
                <FileWarning aria-hidden className="size-4 shrink-0" />
                No rate source on file — request via Front
              </span>
              <Button asChild size="sm" variant="ghost">
                <Link href="/admin/data-sources">
                  <ExternalLink aria-hidden />
                  Data sources
                </Link>
              </Button>
            </div>
          )}
        </div>
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

  const filtersActive = tier !== "all" || coast !== "all" || service !== "all";
  const clearFilters = () => {
    setTier("all");
    setCoast("all");
    setService("all");
  };

  return (
    <AdminGate>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Vendors"
          description="Procurement vendor network — loading, trucking, drayage, customs and specialty services."
        />

        {/* Three across only from lg: between md and lg the sidebar leaves the
            content column ~400px, and at a third of that the KPI subtitles
            clip mid-word. */}
        <div className="grid gap-4 lg:grid-cols-3">
          <StatCard label="Total vendors" value={VENDORS.length} icon={Users} accent="primary" />
          <StatCard label="Tier 1 vendors" value={tier1} sub="Own equipment / crane" icon={Crown} accent="success" />
          <StatCard label="Avg rating" value={avgRating} sub="out of 5.0" icon={Star} accent="warning" />
        </div>

        <Card asChild>
          <section aria-labelledby="vendor-tiers-heading">
            <CardHeader>
              <CardTitle id="vendor-tiers-heading">Vendor tiers</CardTitle>
              <CardDescription>How Atlantic ranks and allocates work across the network.</CardDescription>
            </CardHeader>
            {/* The tiles stay neutral: the tier chip already carries the scale,
                and tinting the surface too made the legend louder than the
                vendors it explains. */}
            <CardContent className="grid gap-3 lg:grid-cols-3">
              {TIER_GUIDE.map((t) => (
                <div key={t.tier} className="rounded-lg bg-muted p-3">
                  <StatusBadge tone={TIER_TONE[t.tier]} dot={false}>Tier {t.tier}</StatusBadge>
                  <p className="mt-2 text-body-sm text-muted-foreground">{t.description}</p>
                </div>
              ))}
            </CardContent>
          </section>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-3 lg:flex lg:items-end">
              <FilterField id="vendor-tier" label="Tier">
                <Select value={tier} onValueChange={setTier}>
                  <SelectTrigger id="vendor-tier" className="w-full lg:w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tiers</SelectItem>
                    <SelectItem value="1">Tier 1</SelectItem>
                    <SelectItem value="2">Tier 2</SelectItem>
                    <SelectItem value="3">Tier 3</SelectItem>
                  </SelectContent>
                </Select>
              </FilterField>

              <FilterField id="vendor-coast" label="Coast">
                <Select value={coast} onValueChange={setCoast}>
                  <SelectTrigger id="vendor-coast" className="w-full lg:w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All coasts</SelectItem>
                    {ALL_COASTS.map((c) => <SelectItem key={c} value={c}>{COAST_LABEL[c]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FilterField>

              <FilterField id="vendor-service" label="Service">
                <Select value={service} onValueChange={setService}>
                  <SelectTrigger id="vendor-service" className="w-full lg:w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All services</SelectItem>
                    {allServices.map((s) => (
                      <SelectItem key={s} value={s}>{SERVICE_LABEL[s] ?? s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end lg:pb-2.5">
              <p role="status" aria-live="polite" className="text-body text-muted-foreground tabular-nums">
                {filtered.length} of {VENDORS.length} vendors
              </p>
              {filtersActive && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <RotateCcw aria-hidden />
                  Clear filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <section aria-labelledby="vendor-directory-heading">
          <h2 id="vendor-directory-heading" className="sr-only">Vendor directory</h2>
          {filtered.length > 0 ? (
            <ul className="grid gap-4 lg:grid-cols-2">
              {filtered.map((v) => (
                <li key={v.id} className="min-w-0">
                  <VendorCard vendor={v} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No vendors match these filters"
              description="Try a different tier, coast or service."
              action={
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <RotateCcw aria-hidden />
                  Clear filters
                </Button>
              }
            />
          )}
        </section>
      </div>
    </AdminGate>
  );
}
