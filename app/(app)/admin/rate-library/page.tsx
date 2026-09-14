"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Upload, Plus, Library, Ship, Truck, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { AdminGate } from "@/components/admin-gate";
import { PageHeader } from "@/components/page-header";
import { StatCard, IconTile } from "@/components/stat-card";
import { CarrierName } from "@/components/carrier-name";
import { CountryFlag, LocodeLane } from "@/components/location-label";
import { EmptyState } from "@/components/empty-state";
import { FilterBar, FilterField } from "@/components/filter-bar";
import { LinkedTableRow } from "@/components/linked-table-row";
import { Card } from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
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
  getCarrier,
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

/** Where a row opens. The record page is the home of everything this table
    deliberately leaves out — the data source, the raw contract line, history. */
function rateHref(r: RateRow): string {
  return `/admin/rate-library/${r.id}`;
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

/* The type and the lane are one subject — "an ocean rate from Houston to
   Brisbane" — so they share a cell: the badge is what you scan for, the lane
   qualifies it underneath. Two columns' worth of width for one idea was the
   single biggest reason this table used to run off its own scroller. */
function TypeAndLane({ rate }: { rate: RateRow }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <StatusBadge tone={TYPE_TONE[rate.type]} dot={false}>
        {RATE_TYPE_LABEL[rate.type]}
      </StatusBadge>
      <span className="text-caption text-muted-foreground">
        <LaneCell rate={rate} />
      </span>
    </div>
  );
}

/** Who the rate is with, and the source it came in on. The source used to be a
    column of its own plus a second row button; it is provenance, not something
    a reader compares down the page, so it sits under the name and the full
    record lives on the detail page. */
function PartyCell({ rate }: { rate: RateRow }) {
  const carrier = getCarrier(rate.carrierId);
  const vendor = getVendor(rate.vendorId);
  const source = getDataSource(rate.dataSourceId);
  return (
    // The name is capped rather than allowed to set the column's width, so a
    // long carrier truncates with its full name on hover instead of pushing
    // the money and validity columns off the table.
    <div className="flex min-w-0 flex-col" title={carrier?.name ?? vendor?.name}>
      {rate.carrierId ? (
        <CarrierName carrierId={rate.carrierId} />
      ) : vendor ? (
        <span className="truncate text-body font-medium text-foreground">{vendor.name}</span>
      ) : (
        <Dash />
      )}
      {source && (
        <span className="truncate text-caption text-muted-foreground" title={source.name}>
          {source.name}
        </span>
      )}
    </div>
  );
}

/** What is being moved or handled. Commodity and container describe the same
    thing at two grains, so the row shows the specific one it has and keeps the
    other as its qualifier. */
function ServiceCell({ rate }: { rate: RateRow }) {
  if (!rate.commodity && !rate.container) return <Dash />;
  return (
    <div className="flex min-w-0 flex-col">
      <span className="truncate text-body text-foreground" title={rate.commodity ?? rate.container}>
        {rate.commodity ?? rate.container}
      </span>
      {rate.commodity && rate.container && (
        <span className="truncate text-caption text-muted-foreground">{rate.container}</span>
      )}
    </div>
  );
}

/** The money and what it buys. The unit sits UNDER the figure rather than
    beside it, so a column of amounts still lines up on its digits and on its
    right edge — the reason the unit was split out into a column of its own
    before, at the cost of a column the table could not afford. */
function CostCell({ rate }: { rate: RateRow }) {
  return (
    <>
      <span className="block font-medium text-foreground">{money(rate.rate, rate.currency)}</span>
      <span className="block text-caption font-normal text-muted-foreground">{rate.unit}</span>
    </>
  );
}

/** One validity, not two date columns. Each date holds together as a unit and
    the range breaks between them when the column is squeezed, so a narrow
    viewport costs a line here instead of a sideways scroll for the whole
    table. */
function ValidityCell({ rate }: { rate: RateRow }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-body whitespace-normal">
        <span className="tabular-nums whitespace-nowrap">{fmtDate(rate.validFrom)}</span>
        <span className="text-muted-foreground"> → </span>
        <span className="tabular-nums whitespace-nowrap">{fmtDate(rate.validTo)}</span>
      </span>
      {isExpired(rate.validTo) && (
        <StatusBadge tone="warning" dot={false}>
          Expired
        </StatusBadge>
      )}
    </div>
  );
}

/** Every row's action reads the same ("See details"), so the accessible name
    has to carry the row: the lane where there is one, the item otherwise. */
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

  const activeFilters = (query.trim() ? 1 : 0) + (typeFilter === "all" ? 0 : 1);

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

        {/* The shared filter band, same as every other table in the product.
            Rate type is a select rather than six tabs: the strip could not fit
            a phone without scrolling sideways, and "Trucking (inland)" reads
            better as a line in a menu than as a tab. */}
        <FilterBar onReset={clearFilters} activeCount={activeFilters}>
          <FilterField label="Search" htmlFor="rate-search" className="sm:w-80">
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
          </FilterField>
          <FilterField label="Rate type" htmlFor="rate-type" className="sm:w-56">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as RateType | "all")}>
              <SelectTrigger id="rate-type">
                <SelectValue placeholder="All rate types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All rate types</SelectItem>
                {TYPE_ORDER.map((t) => (
                  <SelectItem key={t} value={t}>
                    {RATE_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
        </FilterBar>

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
              {/* xl+ : a block of figures read down its columns, so compact
                  rows and right-aligned money. Seven columns, each carrying its
                  own secondary line, is what this data compresses to — measured
                  at 932px, which is what a 1280 window leaves beside the
                  sidebar. Narrower than that and the stacked list underneath
                  takes over, rather than the table scrolling sideways. */}
              <div className="hidden xl:block">
                <Table density="compact">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Type &amp; lane</TableHead>
                      <TableHead>Carrier / Vendor</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead numeric>Rate</TableHead>
                      <TableHead>Validity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r) => (
                      <LinkedTableRow key={r.id} href={rateHref(r)}>
                        <TableCell>
                          <TypeAndLane rate={r} />
                        </TableCell>
                        {/* The two free-text columns are capped so one
                            40-character vendor or file name cannot push the
                            money and validity columns off the scroller. The cap
                            is what the table has to spare at 1280; on a wide
                            screen there is room to let the names read in full
                            instead. */}
                        <TableCell className="max-w-[10rem] 2xl:max-w-[15rem]">
                          <PartyCell rate={r} />
                        </TableCell>
                        <TableCell className="max-w-[10rem] 2xl:max-w-[15rem]">
                          <ServiceCell rate={r} />
                        </TableCell>
                        <TableCell numeric>
                          <CostCell rate={r} />
                        </TableCell>
                        <TableCell>
                          <ValidityCell rate={r} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</StatusBadge>
                        </TableCell>
                        {/* The row already opens the rate; this link is what
                            makes that visible — and it is the row's single tab
                            stop, which is how LinkedTableRow expects to be
                            driven from a keyboard. */}
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={rateHref(r)} aria-label={`See details — ${rateLabel(r)}`}>
                              See details
                            </Link>
                          </Button>
                        </TableCell>
                      </LinkedTableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* below xl : the same fields, stacked, so a narrow window never
                  scrolls a table sideways to reach the rate. */}
              <Card asChild className="xl:hidden">
                <ul>
                  {results.map((r) => (
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
                          <PartyCell rate={r} />
                        </Field>
                        <Field label="Service">
                          <ServiceCell rate={r} />
                        </Field>
                        <Field label="Rate">
                          <span className="font-medium tabular-nums">{money(r.rate, r.currency)}</span>{" "}
                          <span className="text-muted-foreground">{r.unit}</span>
                        </Field>
                        <Field label="Validity">
                          <ValidityCell rate={r} />
                        </Field>
                      </dl>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={rateHref(r)} aria-label={`See details — ${rateLabel(r)}`}>
                          See details
                        </Link>
                      </Button>
                    </li>
                  ))}
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
            <Button
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={() =>
                toast("No file picker in this development preview", {
                  description: "The mapping below is a fixed sample parse.",
                })
              }
            >
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
                      <TableCell><LocodeLane lane={row.lane} /></TableCell>
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
