"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Crown, RotateCcw, Star, Users, Wrench } from "lucide-react";
import { AdminGate } from "@/components/admin-gate";
import { useVendors } from "@/lib/vendor-overrides";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { FilterBar, FilterField } from "@/components/filter-bar";
import { LinkedTableRow } from "@/components/linked-table-row";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  dataSourcesForVendor, ratesForVendor, SERVICE_LABEL, TIER_GUIDE,
} from "@/lib/data";
import type { Coast, Vendor, VendorTier } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ============================================================================
   Vendors — the procurement directory.

   A vendor is a record with its own page, so the list is a table of records
   (one row, one vendor, one destination) rather than a wall of cards: the
   contact details, notes and per-source breakdown a card carried now live on
   /admin/vendors/<id>, and the list keeps only what you compare vendors by.
   ========================================================================= */

const TIER_TONE: Record<VendorTier, StatusTone> = {
  1: "positive",
  2: "info",
  3: "neutral",
};

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

/** The shared accordion content block is written for prose: a `p` that is not
    the last child gets a bottom margin, and every link inside is underlined.
    Both panels here hold tiles and buttons instead, where that margin lands
    between a tile's own two lines and the underline turns buttons into text. */
const PANEL = "[&_p:not(:last-child)]:mb-0 [&_a]:no-underline";

/** Anchor targets are jumped to from the summary, so they keep a little air
    above them rather than butting against the top of the viewport. */
const ANCHOR = "scroll-mt-6";

/** How many service chips a table row shows before it counts the rest. Three
    is what fits beside the other columns without the row wrapping. */
const SERVICE_CHIP_LIMIT = 3;

function Rating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <Star aria-hidden className="size-4 fill-status-warning-fg text-status-warning-fg" />
      <span className="font-medium">{value.toFixed(1)}</span>
      <span className="sr-only">out of 5</span>
    </span>
  );
}

/** The services a vendor sells. `limit` is for the table, where the column has
    to hold a fixed width; the stacked list below lg shows all of them. */
function ServiceChips({ services, limit }: { services: Vendor["services"]; limit?: number }) {
  const shown = limit ? services.slice(0, limit) : services;
  const rest = services.length - shown.length;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {shown.map((s) => (
        <Badge key={s} variant="secondary">{SERVICE_LABEL[s]}</Badge>
      ))}
      {rest > 0 && (
        <span className="text-caption text-muted-foreground tabular-nums">
          +{rest}
          <span className="sr-only">
            {" "}more: {services.slice(shown.length).map((s) => SERVICE_LABEL[s]).join(", ")}
          </span>
        </span>
      )}
    </span>
  );
}

/** What RMS holds for this vendor's rates. A vendor with nothing on file is
    the one thing procurement acts on from this list, so it is stated as a
    warning chip rather than as a zero. */
function RateSources({ vendorId }: { vendorId: string }) {
  const sources = dataSourcesForVendor(vendorId).length;
  const rates = ratesForVendor(vendorId).length;

  if (sources === 0 && rates === 0) {
    return <StatusBadge tone="warning">No rate source</StatusBadge>;
  }
  return (
    <span className="text-body text-muted-foreground tabular-nums">
      {sources} source{sources === 1 ? "" : "s"} · {rates} rate{rates === 1 ? "" : "s"}
    </span>
  );
}

/** The one row action. Visible even though the whole row is clickable, so the
    destination is never something you have to discover. Ghost in the table,
    where the row itself is the affordance; outlined in the stacked list, where
    it is the only thing to press. */
function SeeDetails({
  vendor, variant = "ghost", className,
}: {
  vendor: Vendor;
  variant?: "ghost" | "outline";
  className?: string;
}) {
  return (
    <Button asChild variant={variant} size="sm" className={className}>
      <Link href={`/admin/vendors/${vendor.id}`} aria-label={`See details for ${vendor.name}`}>
        See details <ArrowRight aria-hidden className="size-4" />
      </Link>
    </Button>
  );
}

/** One field of the stacked, below-md presentation of a row. */
function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-body text-foreground">{children}</dd>
    </>
  );
}

export default function VendorsPage() {
  const [tier, setTier] = useState<string>("all");
  const [coast, setCoast] = useState<string>("all");
  const [service, setService] = useState<string>("all");
  // The tier guide is controlled so the summary's "Vendor tiers" link can open
  // it on the way past, instead of scrolling to a closed disclosure.
  const [tierGuide, setTierGuide] = useState<string>("");

  /* The override-aware list, so a vendor edited on its detail page this
     session reads correctly here rather than reverting to the stored record. */
  const VENDORS = useVendors();

  const allServices = useMemo(
    () => Array.from(new Set(VENDORS.flatMap((v) => v.services))).sort(),
    [VENDORS],
  );

  const filtered = useMemo(
    () =>
      VENDORS.filter(
        (v) =>
          (tier === "all" || String(v.tier) === tier) &&
          (coast === "all" || v.coast === coast) &&
          (service === "all" || v.services.includes(service as Vendor["services"][number])),
      ),
    [VENDORS, tier, coast, service],
  );

  const tier1 = VENDORS.filter((v) => v.tier === 1).length;
  const avgRating = (VENDORS.reduce((s, v) => s + v.rating, 0) / VENDORS.length).toFixed(1);

  const activeCount = [tier, coast, service].filter((v) => v !== "all").length;
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

        {/* 1 · Summary. Collapsible, because it is context for the table rather
               than the work itself; the table below never moves out of reach. */}
        <Accordion type="single" collapsible defaultValue="summary" asChild>
          <section aria-labelledby="vendor-summary-heading">
            <AccordionItem value="summary">
              <AccordionTrigger className="min-h-11 items-center px-1">
                <span className="flex flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1 pr-3">
                  <span id="vendor-summary-heading" className="text-h4 text-foreground">
                    Network summary
                  </span>
                  {/* Spelled out as well as drawn: the chevron alone leaves the
                      reader to guess whether the header is pressable. */}
                  <span className="text-body font-medium text-primary group-aria-expanded/accordion-trigger:hidden">
                    Show summary
                  </span>
                  <span className="hidden text-body font-medium text-primary group-aria-expanded/accordion-trigger:inline">
                    Hide summary
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className={cn(PANEL, "flex flex-col gap-4 pb-1")}>
                {/* Three across only from lg: between md and lg the sidebar
                    leaves the content column ~400px, and at a third of that the
                    KPI subtitles clip mid-word. */}
                <div className="grid gap-4 lg:grid-cols-3">
                  <StatCard label="Total vendors" value={VENDORS.length} icon={Users} accent="primary" />
                  <StatCard label="Tier 1 vendors" value={tier1} sub="Own equipment / crane" icon={Crown} accent="success" />
                  <StatCard label="Avg rating" value={avgRating} sub="out of 5.0" icon={Star} accent="warning" />
                </div>

                {/* The summary is the top of the page, so it also has to be the
                    way down it — to the directory and to what a tier means. */}
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a href="#all-vendors">
                      All vendors <ArrowRight aria-hidden className="size-4" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a href="#vendor-tiers" onClick={() => setTierGuide("tier-guide")}>
                      Vendor tiers <ArrowRight aria-hidden className="size-4" />
                    </a>
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </section>
        </Accordion>

        {/* 2 · What a tier means */}
        <Card asChild>
          <section id="vendor-tiers" aria-labelledby="vendor-tiers-heading" className={ANCHOR}>
            <CardHeader>
              <CardTitle id="vendor-tiers-heading">Vendor tiers</CardTitle>
              <CardDescription>How Atlantic ranks and allocates work across the network.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible value={tierGuide} onValueChange={setTierGuide}>
                <AccordionItem value="tier-guide">
                  <AccordionTrigger className="min-h-11 items-center">
                    <span className="text-body font-medium text-primary">See details</span>
                  </AccordionTrigger>
                  <AccordionContent className={cn(PANEL, "pb-1")}>
                    {/* One grid, stretched: the three tiers are read side by
                        side, so they share a width and a height and differ only
                        in what they say. The tiles stay neutral — the tier chip
                        already carries the scale, and tinting the surface too
                        made the legend louder than the vendors it explains. */}
                    <ul className="grid items-stretch gap-3 lg:grid-cols-3">
                      {TIER_GUIDE.map((t) => (
                        <li
                          key={t.tier}
                          className="flex h-full flex-col gap-2 rounded-lg border border-border bg-muted p-4 transition-colors hover:border-border-strong"
                        >
                          <StatusBadge tone={TIER_TONE[t.tier]} dot={false}>Tier {t.tier}</StatusBadge>
                          <p className="text-h4m text-foreground">{t.title}</p>
                          <p className="text-body-sm text-muted-foreground">{t.description}</p>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </section>
        </Card>

        {/* 3 · Filters — the shared band, above the table it filters */}
        <FilterBar onReset={clearFilters} activeCount={activeCount}>
          <FilterField label="Tier" htmlFor="vendor-tier">
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger id="vendor-tier"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tiers</SelectItem>
                <SelectItem value="1">Tier 1</SelectItem>
                <SelectItem value="2">Tier 2</SelectItem>
                <SelectItem value="3">Tier 3</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Coast" htmlFor="vendor-coast">
            <Select value={coast} onValueChange={setCoast}>
              <SelectTrigger id="vendor-coast"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All coasts</SelectItem>
                {ALL_COASTS.map((c) => <SelectItem key={c} value={c}>{COAST_LABEL[c]}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Service" htmlFor="vendor-service">
            <Select value={service} onValueChange={setService}>
              <SelectTrigger id="vendor-service"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                {allServices.map((s) => (
                  <SelectItem key={s} value={s}>{SERVICE_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
        </FilterBar>

        {/* 4 · The directory */}
        <Card asChild className="gap-4 p-0 py-5">
          <section id="all-vendors" aria-labelledby="all-vendors-heading" className={ANCHOR}>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5">
              <h2 id="all-vendors-heading" className="text-h4 text-foreground">All vendors</h2>
              <p role="status" aria-live="polite" className="text-body tabular-nums text-muted-foreground">
                {filtered.length} of {VENDORS.length} vendors
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="px-5">
                <EmptyState
                  title="No vendors match these filters"
                  description="Try a different tier, coast or service."
                  className="border-dashed shadow-none"
                  action={
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      <RotateCcw aria-hidden className="size-4" />
                      Clear filters
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                {/* lg+ : one column per thing vendors are compared by, services
                    and rate sources joining at xl. The split is lg rather than
                    the usual md because these rows are two lines deep: measured
                    at 768 the sidebar leaves ~420px, and even four columns had
                    to scroll the row action out of reach. Below that the same
                    fields stack — see the list underneath. */}
                <div className="hidden lg:block">
                  <Table plain>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Vendor</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead className="hidden xl:table-cell">Services</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead className="hidden xl:table-cell">Rate sources</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((v) => (
                        <LinkedTableRow key={v.id} href={`/admin/vendors/${v.id}`}>
                          <TableCell>
                            {/* The row's own link: one tab stop, a real href,
                                and what `focus-within` lights the row from. */}
                            <Link
                              href={`/admin/vendors/${v.id}`}
                              className="font-medium text-foreground hover:text-primary hover:underline"
                            >
                              {v.name}
                            </Link>
                            <span className="mt-0.5 block text-caption text-muted-foreground">
                              {v.baseLocation} · {COAST_LABEL[v.coast]}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="flex flex-col items-start gap-1">
                              <StatusBadge tone={TIER_TONE[v.tier]} dot={false}>Tier {v.tier}</StatusBadge>
                              {v.ownsEquipment && (
                                <span className="inline-flex items-center gap-1 text-caption font-medium text-status-positive-fg">
                                  <Wrench aria-hidden className="size-3.5 shrink-0" />
                                  Owns equipment
                                </span>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            <ServiceChips services={v.services} limit={SERVICE_CHIP_LIMIT} />
                          </TableCell>
                          <TableCell><Rating value={v.rating} /></TableCell>
                          <TableCell className="hidden xl:table-cell">
                            <RateSources vendorId={v.id} />
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                              <SeeDetails vendor={v} className="px-2" />
                            </div>
                          </TableCell>
                        </LinkedTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* below lg : the same fields, stacked, so nothing overflows */}
                <ul className="lg:hidden">
                  {filtered.map((v) => (
                    <li
                      key={v.id}
                      className="flex flex-col gap-3 border-b border-[var(--c-table-border)] px-5 py-4 last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/admin/vendors/${v.id}`}
                          className="min-w-0 text-body font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {v.name}
                        </Link>
                        <StatusBadge tone={TIER_TONE[v.tier]} dot={false} className="shrink-0">
                          Tier {v.tier}
                        </StatusBadge>
                      </div>
                      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                        <Cell label="Based in">{v.baseLocation} · {COAST_LABEL[v.coast]}</Cell>
                        <Cell label="Rating"><Rating value={v.rating} /></Cell>
                        <Cell label="Equipment">
                          {v.ownsEquipment ? "Owns equipment / crane" : "Uses partner equipment"}
                        </Cell>
                        <Cell label="Services"><ServiceChips services={v.services} /></Cell>
                        <Cell label="Rate sources"><RateSources vendorId={v.id} /></Cell>
                      </dl>
                      <SeeDetails vendor={v} variant="outline" className="w-full" />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </Card>
      </div>
    </AdminGate>
  );
}
