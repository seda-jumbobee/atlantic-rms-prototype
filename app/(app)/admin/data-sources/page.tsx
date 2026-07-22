"use client";

import { useMemo, useState } from "react";
import { Plug, FileSpreadsheet, MessageSquare, Inbox, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { AdminGate } from "@/components/admin-gate";
import { PageHeader } from "@/components/page-header";
import { CarrierLogo } from "@/components/carrier-logo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  return (
    <StatusBadge tone={STATUS_TONE[status]} className="font-normal">
      {STATUS_LABEL[status]}
    </StatusBadge>
  );
}

function SourceTable({ sources }: { sources: DataSource[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Source</TableHead>
          <TableHead>Carrier / Vendor</TableHead>
          <TableHead>Format</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Validity</TableHead>
          <TableHead className="text-right">Rates</TableHead>
          <TableHead>Last sync</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sources.map((ds) => {
          const vendor = getVendor(ds.vendorId);
          const expired = isExpired(ds);
          return (
            <TableRow key={ds.id}>
              <TableCell className="max-w-[280px]">
                <div className="font-medium">{ds.name}</div>
                {ds.description && (
                  <div className="text-xs text-muted-foreground">{ds.description}</div>
                )}
              </TableCell>
              <TableCell>
                {ds.carrierId ? (
                  <CarrierLogo carrierId={ds.carrierId} size="sm" showName />
                ) : vendor ? (
                  <span className="text-sm">{vendor.name}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {ds.format ? (
                  <Badge variant="secondary" className="bg-muted font-normal text-muted-foreground">
                    {ds.format}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell><SourceStatusBadge status={ds.status} /></TableCell>
              <TableCell>
                <div className="text-sm tabular-nums">
                  {fmtDate(ds.validFrom)} → {fmtDate(ds.validTo)}
                </div>
                {expired && (
                  <div className="text-xs font-medium text-status-warning-fg">expired — still quotable</div>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {ds.rateCount != null ? ds.rateCount.toLocaleString() : "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground tabular-nums">
                {ds.lastSync ? fmtDate(ds.lastSync) : "—"}
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
      <div className="space-y-6">
        <PageHeader
          title="Data Sources"
          description="Every rate feed behind the quote engine — APIs, uploaded contracts, custom quotes and Front imports."
        >
          <BulkUploadDialog />
        </PageHeader>

        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sources by name, description or vendor…"
            className="pl-8"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {KIND_ORDER.map((k) => {
            const meta = KIND_META[k];
            const Icon = meta.icon;
            return (
              <Card key={k}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center gap-2">
                    <div className="grid size-8 place-items-center rounded-lg bg-muted text-primary">
                      <Icon className="size-4" />
                    </div>
                    <span className="text-sm font-medium">{meta.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{meta.blurb}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {expiredCount > 0 && (
          <p className="text-xs text-status-warning-fg">
            {expiredCount} source{expiredCount > 1 ? "s" : ""} past validity — these remain quotable until replaced.
          </p>
        )}

        <Tabs defaultValue={KIND_ORDER[0]}>
          <TabsList className="max-w-full overflow-x-auto">
            {KIND_ORDER.map((k) => {
              const count = filtered.filter((d) => d.kind === k).length;
              return (
                <TabsTrigger key={k} value={k}>
                  {KIND_META[k].label}
                  <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground tabular-nums">
                    {count}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>
          {KIND_ORDER.map((k) => {
            const sources = filtered.filter((d) => d.kind === k);
            return (
              <TabsContent key={k} value={k} className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{KIND_META[k].label}</CardTitle>
                    <CardDescription>{KIND_META[k].blurb}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sources.length ? (
                      <SourceTable sources={sources} />
                    ) : (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        {query ? "No sources match your search." : "No sources of this kind."}
                      </p>
                    )}
                  </CardContent>
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
          <Upload className="size-4" /> Bulk upload contract
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk upload contract</DialogTitle>
          <DialogDescription>
            Drop a negotiated carrier contract or vendor tariff — we parse it and register a new data source.
          </DialogDescription>
        </DialogHeader>

        <div className="grid place-items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-4 py-10 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-muted text-primary">
            <FileSpreadsheet className="size-5" />
          </div>
          <p className="text-sm font-medium">Drag &amp; drop a contract here</p>
          <p className="text-xs text-muted-foreground">XLS / XLSX, CSV or PDF — up to 25 MB</p>
          <Button variant="outline" size="sm" className="mt-1" onClick={() => toast("Choose a file to upload")}>
            Browse files
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Detected mapping preview</p>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8 text-xs">Lane</TableHead>
                  <TableHead className="h-8 text-xs">Item</TableHead>
                  <TableHead className="h-8 text-xs">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PARSED_PREVIEW.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="py-1.5 text-xs tabular-nums">{row.lane}</TableCell>
                    <TableCell className="py-1.5 text-xs">{row.item}</TableCell>
                    <TableCell className="py-1.5 text-xs tabular-nums">{row.rate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">124 rows parsed · 3 shown · 2 flagged for review</p>
        </div>

        <DialogFooter>
          <Button onClick={() => toast.success("Importing contract — 124 rates queued for review…")}>
            <Upload className="size-4" /> Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
