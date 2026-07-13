"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Upload, Plus, Library, Ship, Truck, AlertTriangle, FileSpreadsheet, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { AdminGate } from "@/components/admin-gate";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { CarrierLogo } from "@/components/carrier-logo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  RATE_LIBRARY,
  RATE_TYPE_LABEL,
  searchRates,
  getVendor,
  getDataSource,
  type RateType,
} from "@/lib/data";
import { money, fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const TODAY = new Date("2026-06-23T00:00:00Z").getTime();

const STATUS_STYLE: Record<string, string> = {
  actual: "bg-success/15 text-success",
  on_review: "bg-amber-100 text-amber-700",
  old: "bg-slate-100 text-slate-700",
};
const STATUS_LABEL: Record<string, string> = {
  actual: "Actual",
  on_review: "On review",
  old: "Old",
};

const TYPE_STYLE: Record<RateType, string> = {
  ocean: "bg-blue-100 text-blue-700",
  roro: "bg-cyan-100 text-cyan-700",
  trucking: "bg-amber-100 text-amber-700",
  loading: "bg-violet-100 text-violet-700",
  drayage: "bg-emerald-100 text-emerald-700",
  surcharge: "bg-rose-100 text-rose-700",
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

  return (
    <AdminGate>
      <div className="space-y-6">
        <PageHeader
          title="Rate Library"
          description="One searchable home for every rate behind the quote engine — ocean, RoRo, trucking, loading, drayage and surcharges. Bulk-upload contracts to keep it fresh."
        >
          <BulkUploadDialog />
          <Button onClick={() => toast.success("Opening rate editor…")}>
            <Plus className="size-4" /> Add rate
          </Button>
        </PageHeader>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search lanes, carriers, commodities, containers…"
              className="pl-8"
            />
          </div>
          <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as RateType | "all")}>
            <TabsList className="max-w-full overflow-x-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              {TYPE_ORDER.map((t) => (
                <TabsTrigger key={t} value={t}>
                  {RATE_TYPE_LABEL[t]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Lane</TableHead>
                  <TableHead>Carrier / Vendor</TableHead>
                  <TableHead>Container</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => {
                  const vendor = getVendor(r.vendorId);
                  const source = getDataSource(r.dataSourceId);
                  const expired = isExpired(r.validTo);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Badge variant="secondary" className={cn("font-normal", TYPE_STYLE[r.type])}>
                          {RATE_TYPE_LABEL[r.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.origin || r.destination ? (
                          <span className="tabular-nums">
                            {r.origin ?? "—"} → {r.destination ?? "—"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.carrierId ? (
                          <CarrierLogo carrierId={r.carrierId} size="sm" showName />
                        ) : vendor ? (
                          <span className="text-sm">{vendor.name}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.container ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="max-w-[200px] text-sm">
                        {r.commodity ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        <span className="font-medium">{money(r.rate, r.currency)}</span>
                        <span className="text-muted-foreground"> {r.unit}</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm tabular-nums">
                          {fmtDate(r.validFrom)} → {fmtDate(r.validTo)}
                        </div>
                        {expired && <div className="text-xs font-medium text-amber-600">expired</div>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {source ? (
                          <Link
                            href="/admin/data-sources"
                            className="text-primary hover:underline"
                          >
                            {source.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn("font-normal", STATUS_STYLE[r.status])}>
                          {STATUS_LABEL[r.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast("Opening rate editor…")}
                          >
                            Edit
                          </Button>
                          {source && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href="/admin/data-sources">
                                <ExternalLink className="size-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {results.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                      No rates match your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Showing {results.length} of {total} rates. Search across every rate type at once, or bulk-upload a
          contract to refresh hundreds of lanes in one pass.
        </p>
      </div>
    </AdminGate>
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk upload rates</DialogTitle>
          <DialogDescription>
            Drop a carrier contract or vendor tariff — we parse it and map it into the library.
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
                  <TableHead className="h-8 text-xs">Type</TableHead>
                  <TableHead className="h-8 text-xs">Lane</TableHead>
                  <TableHead className="h-8 text-xs">Carrier / Item</TableHead>
                  <TableHead className="h-8 text-xs">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PARSED_PREVIEW.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="py-1.5 text-xs capitalize">{row.type}</TableCell>
                    <TableCell className="py-1.5 text-xs tabular-nums">{row.lane}</TableCell>
                    <TableCell className="py-1.5 text-xs">{row.carrier}</TableCell>
                    <TableCell className="py-1.5 text-xs tabular-nums">{row.rate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">124 rows parsed · 3 shown · 2 flagged for review</p>
        </div>

        <DialogFooter>
          <Button onClick={() => toast.success("Importing 124 rates into the library…")}>
            <Upload className="size-4" /> Import 124 rates
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
