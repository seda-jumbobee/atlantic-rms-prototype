"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, DollarSign, AlertTriangle, RefreshCcw, ExternalLink } from "lucide-react";
import { AdminGate } from "@/components/admin-gate";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  VENDOR_INVOICES, invoiceTotals, dealForInvoice, getVendor, getCarrier,
} from "@/lib/data";
import { money, fmtDate } from "@/lib/format";
import type { VendorInvoice } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<NonNullable<VendorInvoice["status"]>, string> = {
  matched: "bg-success/15 text-success",
  discrepancy: "bg-destructive/10 text-destructive",
  pending: "bg-amber-100 text-amber-700",
};

const QBO_STYLE: Record<NonNullable<VendorInvoice["qboStatus"]>, string> = {
  synced: "bg-success/15 text-success",
  pending: "bg-amber-100 text-amber-700",
  unmatched: "bg-slate-100 text-slate-600",
};

function vendorName(id: string): string {
  return getVendor(id)?.name ?? getCarrier(id)?.name ?? id;
}

export default function InvoicesPage() {
  const [status, setStatus] = useState<string>("all");
  const [qbo, setQbo] = useState<string>("all");

  const filtered = useMemo(
    () =>
      VENDOR_INVOICES.filter(
        (inv) =>
          (status === "all" || inv.status === status) &&
          (qbo === "all" || (inv.qboStatus ?? "unmatched") === qbo),
      ),
    [status, qbo],
  );

  const totalInvoiced = VENDOR_INVOICES.reduce((s, inv) => s + invoiceTotals(inv).invoiced, 0);
  const discrepancies = VENDOR_INVOICES.filter((inv) => inv.status === "discrepancy").length;
  const notSynced = VENDOR_INVOICES.filter((inv) => inv.qboStatus !== "synced").length;

  return (
    <AdminGate>
      <div className="space-y-6">
        <PageHeader
          title="Invoices"
          description="Reconcile every vendor invoice against its quoted rates and the linked QuickBooks bill — across all deals."
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total invoices" value={VENDOR_INVOICES.length} icon={FileText} accent="primary" />
          <StatCard label="Total invoiced" value={money(totalInvoiced)} icon={DollarSign} accent="primary" />
          <StatCard
            label="Discrepancies"
            value={discrepancies}
            sub="invoiced ≠ quoted"
            icon={AlertTriangle}
            accent="destructive"
          />
          <StatCard
            label="Not synced to QBO"
            value={notSynced}
            sub="pending or unmatched"
            icon={RefreshCcw}
            accent="warning"
          />
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <span className="text-sm font-medium">Filter</span>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="discrepancy">Discrepancy</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={qbo} onValueChange={setQbo}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="QuickBooks" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All QBO states</SelectItem>
                <SelectItem value="synced">Synced</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="unmatched">Unmatched</SelectItem>
              </SelectContent>
            </Select>
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
              {filtered.length} of {VENDOR_INVOICES.length} invoices
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Deal</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="text-right">Quoted</TableHead>
                    <TableHead className="text-right">Invoiced</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>QuickBooks</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv) => {
                    const totals = invoiceTotals(inv);
                    const deal = dealForInvoice(inv);
                    const qboStatus = inv.qboStatus ?? "unmatched";
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.reference}</TableCell>
                        <TableCell className="max-w-[220px]">
                          {deal ? (
                            <Link
                              href={`/deals/${inv.dealId}`}
                              className="block truncate text-primary hover:underline"
                              title={deal.title}
                            >
                              {deal.title}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">{inv.dealId}</span>
                          )}
                        </TableCell>
                        <TableCell>{vendorName(inv.vendorId)}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(inv.issuedAt)}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(inv.dueDate)}</TableCell>
                        <TableCell className="text-right tabular-nums">{money(totals.quoted)}</TableCell>
                        <TableCell className="text-right tabular-nums">{money(totals.invoiced)}</TableCell>
                        <TableCell
                          className={cn(
                            "text-right tabular-nums font-medium",
                            totals.variance > 0 && "text-destructive",
                            totals.variance < 0 && "text-success",
                            totals.variance === 0 && "text-muted-foreground",
                          )}
                        >
                          {totals.variance > 0 ? "+" : ""}{money(totals.variance)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn("capitalize", STATUS_STYLE[inv.status])}>
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">{inv.qboRef ?? "—"}</span>
                            <Badge variant="secondary" className={cn("capitalize", QBO_STYLE[qboStatus])}>
                              {qboStatus}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(inv.paid ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}
                          >
                            {inv.paid ? "Paid" : "Unpaid"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                            <Link href={`/deals/${inv.dealId}`}>
                              <ExternalLink className="size-3.5" />
                              Open deal
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">No invoices match the selected filters.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminGate>
  );
}
