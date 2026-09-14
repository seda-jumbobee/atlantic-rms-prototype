"use client";

import { useMemo, useState } from "react";
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

function SourceTable({ sources }: { sources: DataSource[] }) {
  return (
    // `plain` because the table sits inside the section Card — otherwise the two
    // stack a border and a radius on the same edge.
    <Table plain>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Source</TableHead>
          <TableHead>Carrier / Vendor</TableHead>
          <TableHead>Format</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Validity</TableHead>
          <TableHead numeric>Rates</TableHead>
          <TableHead>Last sync</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sources.map((ds) => {
          const vendor = getVendor(ds.vendorId);
          const expired = isExpired(ds);
          return (
            <TableRow key={ds.id}>
              {/* The only cell allowed to wrap. Cells are nowrap by default, so a
                  long file name and its description used to push the whole table
                  sideways rather than fill the width they were capped at. The
                  floor is what stops auto-layout from paying for the narrow
                  viewport out of this one column — the table scrolls instead. */}
              <TableCell className="min-w-[220px] max-w-[280px] whitespace-normal">
                <div className="text-body font-medium text-foreground">{ds.name}</div>
                {ds.description && (
                  <div className="mt-0.5 text-caption text-muted-foreground">{ds.description}</div>
                )}
              </TableCell>
              <TableCell>
                {ds.carrierId ? (
                  <CarrierName carrierId={ds.carrierId} />
                ) : vendor ? (
                  <span className="text-body">{vendor.name}</span>
                ) : (
                  <NoValue />
                )}
              </TableCell>
              <TableCell>
                {/* A format is a kind, not a judgement, so it takes the neutral
                    chip without the state dot — as SourceBadge does for sources. */}
                {ds.format ? (
                  <StatusBadge tone="neutral" dot={false}>{ds.format}</StatusBadge>
                ) : (
                  <NoValue />
                )}
              </TableCell>
              <TableCell><SourceStatusBadge status={ds.status} /></TableCell>
              {/* Allowed to break at the arrow. Held on one line it is the
                  widest nowrap column on the row, and it alone pushed the table
                  past its container at 1280. */}
              <TableCell className="whitespace-normal">
                <div className="text-body tabular-nums">
                  {fmtDate(ds.validFrom)} → {fmtDate(ds.validTo)}
                </div>
                {expired && (
                  <div className="mt-0.5 text-caption font-medium text-status-warning-fg">
                    Expired — still quotable
                  </div>
                )}
              </TableCell>
              <TableCell numeric className="text-body">
                {ds.rateCount != null ? ds.rateCount.toLocaleString() : <NoValue />}
              </TableCell>
              <TableCell className="text-body tabular-nums text-muted-foreground">
                {ds.lastSync ? fmtDate(ds.lastSync) : <NoValue />}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
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

        {/* Search sits directly above the tabs it filters — the counts in the
            tab labels move with it, so the two have to be read together. */}
        <div className="flex flex-col gap-2.5">
          <label htmlFor="source-search" className="text-body font-medium text-foreground">
            Search sources
          </label>
          <div className="relative w-full sm:max-w-md">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="source-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, description or vendor…"
              className="pl-9"
            />
          </div>
        </div>

        {expiredCount > 0 && (
          <Alert variant="warning">
            <AlertTriangle aria-hidden />
            <AlertTitle>
              {expiredCount} source{expiredCount > 1 ? "s" : ""} past validity
            </AlertTitle>
            <AlertDescription>These remain quotable until replaced.</AlertDescription>
          </Alert>
        )}

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
            return (
              <TabsContent key={k} value={k}>
                {/* py-5 matches the 20px the table's edge cells inset by, so the
                    heading row and the rows below it share one left edge. */}
                <Card className="min-w-0 gap-4 p-0 py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-5">
                    <h2 className="text-h4 text-foreground">{meta.label}</h2>
                    <p className="text-caption tabular-nums text-muted-foreground">
                      {sources.length} source{sources.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  {sources.length ? (
                    <SourceTable sources={sources} />
                  ) : (
                    <div className="px-5">
                      <EmptyState
                        icon={query ? undefined : meta.icon}
                        title={query ? "No matching sources" : "No sources of this kind"}
                        description={
                          query
                            ? `Nothing under ${meta.label} matches “${query}”. Another tab may still have results.`
                            : meta.blurb
                        }
                        className="border-dashed shadow-none"
                        action={
                          query ? (
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
            <Button variant="outline" className="mt-2" onClick={() => toast("Choose a file to upload")}>
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
            <p className="text-caption text-muted-foreground">124 rows parsed · 3 shown · 2 flagged for review</p>
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
