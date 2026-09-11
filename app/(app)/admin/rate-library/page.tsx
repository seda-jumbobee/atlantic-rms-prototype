"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Upload, Plus, Library, Ship, Truck, AlertTriangle, FileSpreadsheet, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { AdminGate } from "@/components/admin-gate";
import { PageHeader } from "@/components/page-header";
import { StatCard, IconTile } from "@/components/stat-card";
import { CarrierName } from "@/components/carrier-name";
import { CountryFlag } from "@/components/location-label";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  RATE_LIBRARY,
  RATE_TYPE_LABEL,
  searchRates,
  getVendor,
  getDataSource,
  findPortByLocode,
  type RateRow,
  type RateType,
} from "@/lib/data";
import { money, fmtDate } from "@/lib/format";

const TODAY = new Date("2026-06-23T00:00:00Z").getTime();

const STATUS_TONE: Record<string, StatusTone> = {
  actual: "positive",
  on_review: "warning",
  old: "neutral",
};
const STATUS_LABEL: Record<string, string> = {
  actual: "Actual",
  on_review: "On review",
  old: "Old",
};

const TYPE_TONE: Record<RateType, StatusTone> = {
  ocean: "info",
  roro: "info",
  trucking: "warning",
  loading: "neutral",
  drayage: "positive",
  surcharge: "negative",
};

const TYPE_ORDER: RateType[] = ["ocean", "roro", "trucking", "loading", "drayage", "surcharge"];

function isExpired(validTo?: string): boolean {
  return !!validTo && new Date(validTo).getTime() < TODAY;
}

const PARSED_PREVIEW = [
  { type: "ocean", lane: "USHOU → AUBNE", carrier: "OOCL 40FR", rate: "$9,420 per container" },
  { type: "ocean", lane: "USSAV → AUMEL", carrier: "Hapag 40FR", rate: "$9,910 per container" },
  { type: "surcharge", lane: "—", carrier: "BAF — US exports", rate: "$292 per container" },
];

/** The one way this page draws "no value", so an empty cell never reads as a
    missing column. */
function Dash() {
  return <span className="text-muted-foreground">—</span>;
}

/* A lane end. The library stores ends as UN/LOCODEs ("USHOU"), not as the free
   text `laneCountryCode` parses, so the country comes from the port record the
   code resolves to. A drayage end like "Houston CFS" resolves to no port and
   correctly gets no flag — a flag is only drawn for a country we can name. */
function LaneEnd({ value }: { value?: string }) {
  if (!value) return <Dash />;
  const port = findPortByLocode(value);
  return (
    <span
      className="inline-flex items-center gap-1.5 align-middle"
      title={port ? `${port.name}, ${port.country}` : undefined}
    >
      <CountryFlag cc={port?.countryCode} className="text-sm" />
      <span className="tabular-nums">{value}</span>
    </span>
  );
}

function LaneCell({ rate }: { rate: RateRow }) {
  if (!rate.origin && !rate.destination) return <Dash />;
  return (
    <span className="inline-flex items-center gap-1.5">
      <LaneEnd value={rate.origin} />
      <span className="text-muted-foreground">→</span>
      <LaneEnd value={rate.destination} />
    </span>
  );
}

function ValidityCell({ rate }: { rate: RateRow }) {
  return (
    <>
      <span className="tabular-nums">{fmtDate(rate.validFrom)}</span>
      <span className="text-muted-foreground"> → </span>
      <span className="tabular-nums">{fmtDate(rate.validTo)}</span>
      {isExpired(rate.validTo) && (
        <StatusBadge tone="warning" dot={false} className="ml-2 align-middle">
          Expired
        </StatusBadge>
      )}
    </>
  );
}

function CarrierOrVendor({ rate }: { rate: RateRow }) {
  const vendor = getVendor(rate.vendorId);
  if (rate.carrierId) return <CarrierName carrierId={rate.carrierId} />;
  if (vendor) return <span className="text-body font-medium">{vendor.name}</span>;
  return <Dash />;
}

/** Every row's action reads the same ("Edit"), so the accessible name has to
    carry the row: the lane where there is one, the item otherwise. */
function rateLabel(r: RateRow): string {
  const lane = r.origin || r.destination ? `${r.origin ?? "—"} to ${r.destination ?? "—"}` : undefined;
  return [RATE_TYPE_LABEL[r.type], lane ?? r.commodity ?? r.container].filter(Boolean).join(" · ");
}

export default function RateLibraryPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<RateType | "all">("all");

  const results = useMemo(
    () => searchRates(query, typeFilter === "all" ? undefined : typeFilter),
    [query, typeFilter],
  );

  const total = RATE_LIBRARY.length;
  const oceanCount = RATE_LIBRARY.filter((r) => r.type === "ocean").length;
  const truckingCount = RATE_LIBRARY.filter((r) => r.type === "trucking").length;
  const expiredCount = RATE_LIBRARY.filter((r) => isExpired(r.validTo)).length;

  const clearFilters = () => {
    setQuery("");
    setTypeFilter("all");
  };

  return (
    <AdminGate>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Rate Library"
          description="One searchable home for every rate behind the quote engine — ocean, RoRo, trucking, loading, drayage and surcharges. Bulk-upload contracts to keep it fresh."
        >
          <BulkUploadDialog />
          <Button onClick={() => toast("Rate editor not built yet", { description: "Editing a stored rate needs a backend." })}>
            <Plus className="size-4" /> Add rate
          </Button>
        </PageHeader>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total rates" value={total} icon={Library} accent="primary" />
          <StatCard label="Ocean freight" value={oceanCount} sub="containerized lanes" icon={Ship} accent="primary" />
          <StatCard label="Trucking (inland)" value={truckingCount} sub="per-mile vendor rates" icon={Truck} accent="primary" />
          <StatCard
            label="Expired"
            value={expiredCount}
            sub="past validity — still quotable"
            icon={AlertTriangle}
            accent="warning"
          />
        </div>

        {/* Filters: each group titled at body size, 10px above its control, the
            same as the rate filters on the quote screens. */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="w-full lg:max-w-sm">
            <label htmlFor="rate-search" className="mb-2.5 block text-body font-medium text-foreground">
              Search
            </label>
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="rate-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search lanes, carriers, commodities, containers…"
                className="pl-9"
              />
            </div>
          </div>
          <div className="min-w-0">
            <span id="rate-type-label" className="mb-2.5 block text-body font-medium text-foreground">
              Rate type
            </span>
            {/* The six types never fit a phone: the strip scrolls on its own
                rather than widening the page. The padding is given back as a
                negative margin so the scroller does not clip a focus ring and
                the strip still sits where it would without it. */}
            <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as RateType | "all")}>
              <div className="-my-1 min-w-0 overflow-x-auto py-1">
                <TabsList aria-labelledby="rate-type-label">
                  <TabsTrigger value="all">All</TabsTrigger>
                  {TYPE_ORDER.map((t) => (
                    <TabsTrigger key={t} value={t}>
                      {RATE_TYPE_LABEL[t]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p role="status" aria-live="polite" className="text-body text-muted-foreground">
            Showing {results.length} of {total} rates
          </p>

          {results.length === 0 ? (
            <EmptyState
              title="No rates match your search"
              description="Try another lane, carrier or commodity — or clear the filters to browse the whole library."
              action={
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              {/* md+ : a block of figures read down its columns, so compact rows
                  and right-aligned money. */}
              <div className="hidden md:block">
                <Table density="compact">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Type</TableHead>
                      <TableHead>Lane</TableHead>
                      <TableHead>Carrier / Vendor</TableHead>
                      <TableHead>Container</TableHead>
                      <TableHead>Commodity</TableHead>
                      <TableHead numeric>Rate</TableHead>
                      {/* The unit is its own column: left in the Rate cell it
                          sat between the figures and the right edge, and no two
                          amounts lined up. */}
                      <TableHead>Unit</TableHead>
                      <TableHead>Validity</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r) => {
                      const source = getDataSource(r.dataSourceId);
                      return (
                        <TableRow key={r.id}>
                          <TableCell>
                            <StatusBadge tone={TYPE_TONE[r.type]} dot={false}>
                              {RATE_TYPE_LABEL[r.type]}
                            </StatusBadge>
                          </TableCell>
                          <TableCell>
                            <LaneCell rate={r} />
                          </TableCell>
                          {/* The long free-text columns are capped and truncated
                              so one 40-character vendor or file name cannot push
                              the money and validity columns off the scroller. */}
                          <TableCell className="max-w-[10rem] truncate">
                            <CarrierOrVendor rate={r} />
                          </TableCell>
                          <TableCell>{r.container ?? <Dash />}</TableCell>
                          <TableCell className="max-w-[11rem] truncate" title={r.commodity}>
                            {r.commodity ?? <Dash />}
                          </TableCell>
                          <TableCell numeric className="font-medium">
                            {money(r.rate, r.currency)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{r.unit}</TableCell>
                          <TableCell>
                            <ValidityCell rate={r} />
                          </TableCell>
                          <TableCell className="max-w-[11rem] truncate" title={source?.name}>
                            {source ? (
                              <Link href="/admin/data-sources" className="text-primary hover:underline">
                                {source.name}
                              </Link>
                            ) : (
                              <Dash />
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</StatusBadge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`Edit rate — ${rateLabel(r)}`}
                                onClick={() => toast("Opening rate editor…")}
                              >
                                Edit
                              </Button>
                              {source && (
                                <Button variant="ghost" size="icon-sm" asChild>
                                  <Link href="/admin/data-sources" aria-label={`Open data source ${source.name}`}>
                                    <ExternalLink className="size-4" />
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* below md : the same eleven fields, stacked, so a phone never
                  scrolls a table sideways to reach the rate. */}
              <Card className="md:hidden">
                <ul>
                  {results.map((r) => {
                    const source = getDataSource(r.dataSourceId);
                    return (
                      <li
                        key={r.id}
                        className="flex flex-col gap-3 border-b border-[var(--c-table-border)] p-4 last:border-b-0"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <StatusBadge tone={TYPE_TONE[r.type]} dot={false}>
                            {RATE_TYPE_LABEL[r.type]}
                          </StatusBadge>
                          <StatusBadge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</StatusBadge>
                        </div>
                        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                          <Field label="Lane">
                            <LaneCell rate={r} />
                          </Field>
                          <Field label="Carrier / Vendor">
                            <CarrierOrVendor rate={r} />
                          </Field>
                          <Field label="Container">{r.container ?? <Dash />}</Field>
                          <Field label="Commodity">{r.commodity ?? <Dash />}</Field>
                          <Field label="Rate">
                            <span className="font-medium tabular-nums">{money(r.rate, r.currency)}</span>{" "}
                            <span className="text-muted-foreground">{r.unit}</span>
                          </Field>
                          <Field label="Validity">
                            <ValidityCell rate={r} />
                          </Field>
                          <Field label="Source">
                            {source ? (
                              <Link href="/admin/data-sources" className="text-primary hover:underline">
                                {source.name}
                              </Link>
                            ) : (
                              <Dash />
                            )}
                          </Field>
                        </dl>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            aria-label={`Edit rate — ${rateLabel(r)}`}
                            onClick={() => toast("Opening rate editor…")}
                          >
                            Edit
                          </Button>
                          {source && (
                            <Button variant="outline" size="icon" asChild>
                              <Link href="/admin/data-sources" aria-label={`Open data source ${source.name}`}>
                                <ExternalLink className="size-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </>
          )}

          <p className="text-caption text-muted-foreground">
            Search across every rate type at once, or bulk-upload a contract to refresh hundreds of lanes in one pass.
          </p>
        </div>
      </div>
    </AdminGate>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-body text-foreground">{children}</dd>
    </>
  );
}

function BulkUploadDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="size-4" /> Bulk upload
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk upload rates</DialogTitle>
          <DialogDescription>
            Drop a carrier contract or vendor tariff — we parse it and map it into the library.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4">
          <div className="grid place-items-center gap-2 rounded-lg border-2 border-dashed border-border-strong bg-muted px-4 py-10 text-center">
            <IconTile size="lg" variant="primary" className="rounded-full">
              <FileSpreadsheet />
            </IconTile>
            <p className="text-body font-medium">Drag &amp; drop a contract here</p>
            <p className="text-caption text-muted-foreground">XLS / XLSX, CSV or PDF — up to 25 MB</p>
            <Button variant="outline" size="sm" className="mt-1" onClick={() => toast("Choose a file to upload")}>
              Browse files
            </Button>
          </div>

          <div className="flex flex-col gap-2.5">
            <p className="text-body font-medium text-foreground">Detected mapping preview</p>
            <div className="overflow-hidden rounded-lg border border-[var(--c-table-border)]">
              <Table plain density="compact">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Type</TableHead>
                    <TableHead>Lane</TableHead>
                    <TableHead>Carrier / Item</TableHead>
                    <TableHead>Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PARSED_PREVIEW.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="capitalize">{row.type}</TableCell>
                      <TableCell className="tabular-nums">{row.lane}</TableCell>
                      <TableCell>{row.carrier}</TableCell>
                      <TableCell className="tabular-nums">{row.rate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-caption text-muted-foreground">124 rows parsed · 3 shown · 2 flagged for review</p>
          </div>
        </DialogBody>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={() => toast("Import prepared", { description: "124 rates would be added — no import runs in this development preview." })}>
            <Upload className="size-4" /> Import 124 rates
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
