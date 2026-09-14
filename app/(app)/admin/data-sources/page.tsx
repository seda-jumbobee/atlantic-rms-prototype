"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plug, FileSpreadsheet, MessageSquare, Inbox, Search, Upload, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminGate } from "@/components/admin-gate";
import { LocodeLane } from "@/components/location-label";
import { PageHeader } from "@/components/page-header";
import { CarrierName } from "@/components/carrier-name";
import { EmptyState } from "@/components/empty-state";
import { AccentTile, accentAt } from "@/components/accent-tile";
import { FilterBar, FilterField } from "@/components/filter-bar";
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { DATA_SOURCES, getVendor } from "@/lib/data";
import type { DataSource, DataSourceKind, DataSourceStatus } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import { StatusBadge, type StatusTone } from "@/components/status-badge";

const TODAY = new Date("2026-06-23T00:00:00Z").getTime();

const STATUS_TONE: Record<DataSourceStatus, StatusTone> = {
  actual: "positive",
  on_review: "warning",
  in_edits: "warning",
  additional: "info",
  old: "neutral",
};

const STATUS_LABEL: Record<DataSourceStatus, string> = {
  actual: "Actual",
  on_review: "On review",
  in_edits: "In edits",
  additional: "Additional",
  old: "Old",
};

const KIND_META: Record<DataSourceKind, { label: string; blurb: string; icon: typeof Plug }> = {
  shipping_line_api: {
    label: "Shipping Line API",
    blurb: "Live rate feeds pulled directly from carrier pricing APIs (Maersk, MSC, CMA, ZIM…).",
    icon: Plug,
  },
  uploaded_contract: {
    label: "Uploaded Contract",
    blurb: "Negotiated contract tariffs uploaded as XLS / PDF — ocean freight, surcharges, D&D.",
    icon: FileSpreadsheet,
  },
  custom_request: {
    label: "Custom-requested Rate",
    blurb: "Case-by-case quotes requested from vendors by email, often AI-assisted RFQs.",
    icon: MessageSquare,
  },
  front_import: {
    label: "Front Import",
    blurb: "Inbound vendor emails parsed by the rate-ingestion microservice, pending review.",
    icon: Inbox,
  },
};

const KIND_ORDER: DataSourceKind[] = ["shipping_line_api", "uploaded_contract", "custom_request", "front_import"];

function isExpired(ds: DataSource): boolean {
  return !!ds.validTo && new Date(ds.validTo).getTime() < TODAY;
}

/** Both ends, or whichever single end the record actually carries. Printed
    blind the missing end became a dash, so a custom quote good "until 31 Jul"
    read as "— → 31 Jul 2026": a range whose start we had lost, rather than an
    open-ended validity. */
function validityText(ds: DataSource): string | null {
  if (ds.validFrom && ds.validTo) return `${fmtDate(ds.validFrom)} → ${fmtDate(ds.validTo)}`;
  if (ds.validTo) return `Until ${fmtDate(ds.validTo)}`;
  if (ds.validFrom) return `From ${fmtDate(ds.validFrom)}`;
  return null;
}

/** Which columns this set of sources has anything to say in. A kind whose
    records never sync (a signed contract, an emailed quote) would otherwise
    carry a Last sync column of nothing but dashes, paying table width for a
    value that does not exist for it. Driven by the rows, not by the kind, so
    nothing is ever hidden: a column is dropped only when every row in it is
    empty. */
function columnsFor(sources: DataSource[]) {
  return {
    party: sources.some((d) => d.carrierId || d.vendorId),
    validity: sources.some((d) => d.validFrom || d.validTo),
    rates: sources.some((d) => d.rateCount != null),
    sync: sources.some((d) => d.lastSync),
  };
}

function SourceStatusBadge({ status }: { status: DataSourceStatus }) {
  return <StatusBadge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</StatusBadge>;
}

/** An empty cell. The dash is drawn for the eye; a reader using speech hears a
    word instead of "em dash", which is how the dashboard states a missing value. */
function NoValue() {
  return (
    <>
      <span aria-hidden className="text-muted-foreground">—</span>
      <span className="sr-only">none</span>
    </>
  );
}

/** The source itself: what it is called, what it arrives as, and the line the
    record describes it with. Format rides here rather than in a column of its
    own — it is an attribute of the feed, not of the party that sent it, and a
    column that only ever says "API" costs width the wide rows need. */
function SourceIdentity({ ds }: { ds: DataSource }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-body font-medium text-foreground">{ds.name}</span>
        {/* A format is a kind, not a judgement, so it takes the neutral chip
            without the state dot — as SourceBadge does for sources. */}
        {ds.format && (
          <StatusBadge tone="neutral" dot={false}>{ds.format}</StatusBadge>
        )}
      </div>
      {ds.description && (
        <p className="mt-0.5 text-caption text-muted-foreground">{ds.description}</p>
      )}
    </>
  );
}

/** Who the rates came from. A carrier is named and nothing more — carriers
    have no record page — while a vendor links to its own, which lists this
    very source under "Rate sources". */
function SourceParty({ ds }: { ds: DataSource }) {
  const vendor = getVendor(ds.vendorId);
  if (ds.carrierId) return <CarrierName carrierId={ds.carrierId} />;
  if (vendor) {
    return (
      <Link
        href={`/admin/vendors/${vendor.id}`}
        className="rounded-sm text-body font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {vendor.name}
      </Link>
    );
  }
  return <NoValue />;
}

function Validity({ ds }: { ds: DataSource }) {
  const text = validityText(ds);
  if (!text) return <NoValue />;
  return (
    <>
      <div className="text-body tabular-nums">{text}</div>
      {isExpired(ds) && (
        <div className="mt-0.5 text-caption font-medium text-status-warning-fg">
          Expired — still quotable
        </div>
      )}
    </>
  );
}

function SourceTable({ sources }: { sources: DataSource[] }) {
  const cols = columnsFor(sources);
  return (
    // `plain` because the table sits inside the section Card — otherwise the two
    // stack a border and a radius on the same edge.
    <Table plain>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Source</TableHead>
          {cols.party && <TableHead>Carrier / Vendor</TableHead>}
          <TableHead>Status</TableHead>
          {cols.validity && <TableHead>Validity</TableHead>}
          {cols.rates && <TableHead numeric>Rates</TableHead>}
          {cols.sync && <TableHead>Last sync</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sources.map((ds) => (
          // NOT a LinkedTableRow: a data source has no record page to open.
          // Every field the record holds is already on the row, so the row is
          // left inert rather than sent somewhere that is not this source.
          <TableRow key={ds.id}>
            {/* The only cell allowed to wrap. Cells are nowrap by default, so a
                long file name and its description used to push the whole table
                sideways rather than fill the width they were capped at. The
                floor is what stops auto-layout from paying for the narrow
                viewport out of this one column — the table scrolls instead. */}
            <TableCell className="min-w-[240px] max-w-[340px] whitespace-normal">
              <SourceIdentity ds={ds} />
            </TableCell>
            {cols.party && (
              <TableCell><SourceParty ds={ds} /></TableCell>
            )}
            <TableCell><SourceStatusBadge status={ds.status} /></TableCell>
            {/* Allowed to break at the arrow. Held on one line it is the
                widest nowrap column on the row, and it alone pushed the table
                past its container at 1280. */}
            {cols.validity && (
              <TableCell className="whitespace-normal"><Validity ds={ds} /></TableCell>
            )}
            {cols.rates && (
              <TableCell numeric className="text-body">
                {ds.rateCount != null ? ds.rateCount.toLocaleString() : <NoValue />}
              </TableCell>
            )}
            {cols.sync && (
              <TableCell className="text-body tabular-nums text-muted-foreground">
                {ds.lastSync ? fmtDate(ds.lastSync) : <NoValue />}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** One field of the stacked presentation of a row. */
function ListField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-body text-foreground">{children}</dd>
    </>
  );
}

/** The same rows, stacked. Six columns inside a narrow card would be all
    sideways scrolling, so under a certain width each source stacks its fields
    instead — the treatment the invoices table already set.

    Keyed to the CARD's width, not the viewport's: at 768 the sidebar is still
    open and leaves this card ~380px, which is a phone's worth of room on a
    tablet-width screen. A media query would have shown the table there. */
function SourceList({ sources }: { sources: DataSource[] }) {
  const cols = columnsFor(sources);
  return (
    <ul className="@2xl/sources:hidden">
      {sources.map((ds) => (
        <li
          key={ds.id}
          className="flex flex-col gap-3 border-t border-[var(--c-table-border)] px-5 py-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0"><SourceIdentity ds={ds} /></div>
            {/* The chip keeps its width against a long file name rather than
                being squeezed into two lines of its own. */}
            <span className="shrink-0"><SourceStatusBadge status={ds.status} /></span>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
            {cols.party && (
              <ListField label="Carrier / Vendor"><SourceParty ds={ds} /></ListField>
            )}
            {cols.validity && <ListField label="Validity"><Validity ds={ds} /></ListField>}
            {cols.rates && (
              <ListField label="Rates">
                <span className="tabular-nums">
                  {ds.rateCount != null ? ds.rateCount.toLocaleString() : <NoValue />}
                </span>
              </ListField>
            )}
            {cols.sync && (
              <ListField label="Last sync">
                <span className="tabular-nums">{ds.lastSync ? fmtDate(ds.lastSync) : <NoValue />}</span>
              </ListField>
            )}
          </dl>
        </li>
      ))}
    </ul>
  );
}

export default function DataSourcesPage() {
  const [query, setQuery] = useState("");
  const expiredCount = DATA_SOURCES.filter(isExpired).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DATA_SOURCES;
    return DATA_SOURCES.filter((d) => {
      const vendorName = getVendor(d.vendorId)?.name ?? "";
      return [d.name, d.description, vendorName, d.format]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [query]);

  const searching = query.trim().length > 0;

  return (
    <AdminGate>
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title="Data Sources"
          description="Every rate feed behind the quote engine — APIs, uploaded contracts, custom quotes and Front imports."
        >
          <BulkUploadDialog />
        </PageHeader>

        {/* The four kinds, named once. The tab below shows one kind at a time,
            so this is the only place the whole set can be read at a glance —
            which is why the blurbs live here and not in each tab panel. */}
        <section aria-label="Source kinds" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {KIND_ORDER.map((k, i) => {
            const meta = KIND_META[k];
            const Icon = meta.icon;
            return (
              <Card key={k} className="min-w-0 gap-2 p-4">
                <div className="flex items-center gap-2.5">
                  <AccentTile accent={accentAt(i)}>
                    <Icon aria-hidden className="size-5" />
                  </AccentTile>
                  <span className="text-body font-medium text-foreground">{meta.label}</span>
                </div>
                <p className="text-caption text-muted-foreground">{meta.blurb}</p>
              </Card>
            );
          })}
        </section>

        {/* Counted across every kind, not just the open tab — a contract that
            lapsed is news whichever tab you are standing in. */}
        {expiredCount > 0 && (
          <Alert variant="warning">
            <AlertTriangle aria-hidden />
            <AlertTitle>
              {expiredCount} source{expiredCount > 1 ? "s" : ""} past validity
            </AlertTitle>
            <AlertDescription>These remain quotable until replaced.</AlertDescription>
          </Alert>
        )}

        {/* The product's one filter treatment, sitting directly above what it
            filters — the counts in the tab labels move with it, so the two have
            to be read together. */}
        <FilterBar activeCount={searching ? 1 : 0} onReset={() => setQuery("")}>
          <FilterField label="Search sources" htmlFor="source-search" className="sm:w-80">
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="source-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, description or vendor…"
                className="pl-9"
              />
            </div>
          </FilterField>
          {/* Given the height of a control, the count centres against the field
              it sits beside — and still reads as a row of its own where the bar
              wraps. */}
          <p
            role="status"
            aria-live="polite"
            className="text-body tabular-nums text-muted-foreground sm:ml-auto sm:flex sm:h-11 sm:items-center"
          >
            {filtered.length} of {DATA_SOURCES.length} sources
          </p>
        </FilterBar>

        <Tabs defaultValue={KIND_ORDER[0]} className="gap-4">
          {/* The list scrolls inside its own container rather than widening the
              page; the -mx-1/px-1 pair keeps the end triggers' focus rings
              from being clipped by that scrollport. */}
          <div className="-mx-1 overflow-x-auto px-1">
            <TabsList>
              {KIND_ORDER.map((k) => {
                const count = filtered.filter((d) => d.kind === k).length;
                return (
                  <TabsTrigger key={k} value={k}>
                    {KIND_META[k].label}
                    <span className="text-caption tabular-nums text-muted-foreground">{count}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
          {KIND_ORDER.map((k) => {
            const meta = KIND_META[k];
            const sources = filtered.filter((d) => d.kind === k);
            const total = DATA_SOURCES.filter((d) => d.kind === k).length;
            return (
              <TabsContent key={k} value={k}>
                {/* py-5 matches the 20px the table's edge cells inset by, so the
                    heading row and the rows below it share one left edge. */}
                <Card className="@container/sources min-w-0 gap-4 p-0 py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-5">
                    <h2 className="text-h4 text-foreground">{meta.label}</h2>
                    <p className="text-caption tabular-nums text-muted-foreground">
                      {/* Under a search the denominator is what stops "1 source"
                          reading as "this kind has one". */}
                      {sources.length === total
                        ? `${total} source${total === 1 ? "" : "s"}`
                        : `${sources.length} of ${total} sources`}
                    </p>
                  </div>
                  {sources.length ? (
                    <>
                      <div className="hidden @2xl/sources:block">
                        <SourceTable sources={sources} />
                      </div>
                      <SourceList sources={sources} />
                    </>
                  ) : (
                    <div className="px-5">
                      <EmptyState
                        icon={searching ? undefined : meta.icon}
                        title={searching ? "No matching sources" : "No sources of this kind"}
                        description={
                          searching
                            ? `Nothing under ${meta.label} matches “${query}”. Another tab may still have results.`
                            : meta.blurb
                        }
                        className="border-dashed shadow-none"
                        action={
                          searching ? (
                            <Button size="sm" variant="outline" onClick={() => setQuery("")}>
                              Clear search
                            </Button>
                          ) : undefined
                        }
                      />
                    </div>
                  )}
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </AdminGate>
  );
}

const PARSED_PREVIEW = [
  { lane: "USHOU → AUBNE", item: "Maersk 40FR", rate: "$9,420 / container" },
  { lane: "USSAV → AUMEL", item: "Hapag 40FR", rate: "$9,910 / container" },
  { lane: "—", item: "BAF — US exports", rate: "$292 / container" },
];

function BulkUploadDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload aria-hidden className="size-4" /> Bulk upload contract
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk upload contract</DialogTitle>
          <DialogDescription>
            Drop a negotiated carrier contract or vendor tariff — we parse it and register a new data source.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-2 rounded-card border-2 border-dashed border-border-strong bg-muted px-4 py-10 text-center">
            <AccentTile accent="indigo" className="size-12 rounded-full">
              <FileSpreadsheet aria-hidden className="size-5" />
            </AccentTile>
            <p className="text-body font-medium text-foreground">Drag &amp; drop a contract here</p>
            <p className="text-caption text-muted-foreground">XLS / XLSX, CSV or PDF — up to 25 MB</p>
            {/* Full height, not sm: on a touch device this is the only way in —
                there is nothing to drag from. */}
            <Button
              variant="outline"
              className="mt-2"
              // Inert, and says so: there is no upload endpoint behind this
              // preview, so promising a file picker would be the one thing
              // worse than not opening one.
              onClick={() =>
                toast("No file picker in this preview", {
                  description: "Choosing a contract needs an upload endpoint this development preview does not have.",
                })
              }
            >
              Browse files
            </Button>
          </div>

          <div className="flex flex-col gap-2.5">
            <p className="text-body font-medium text-foreground">Detected mapping preview</p>
            {/* Three short rows read as one block of figures, so compact. */}
            <Table density="compact">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Lane</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PARSED_PREVIEW.map((row) => (
                  <TableRow key={`${row.lane}-${row.item}`}>
                    <TableCell className="text-body"><LocodeLane lane={row.lane} /></TableCell>
                    <TableCell className="text-body">{row.item}</TableCell>
                    <TableCell className="text-body tabular-nums">{row.rate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-caption text-muted-foreground">
              Sample output — 124 rows parsed · 3 shown · 2 flagged for review.
            </p>
          </div>
        </DialogBody>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={() => toast("Contract import prepared", { description: "124 rates would be queued for review — no import runs in this development preview." })}>
            <Upload aria-hidden className="size-4" /> Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
