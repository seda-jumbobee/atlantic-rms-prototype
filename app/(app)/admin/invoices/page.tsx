"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FileText, DollarSign, AlertTriangle, RefreshCcw, ArrowRight, RotateCcw,
} from "lucide-react";
import { AdminGate } from "@/components/admin-gate";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { CarrierName } from "@/components/carrier-name";
import { LinkedTableRow } from "@/components/linked-table-row";
import { FilterBar, FilterField } from "@/components/filter-bar";
import { Card } from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
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

const STATUS_TONE: Record<NonNullable<VendorInvoice["status"]>, StatusTone> = {
  matched: "positive",
  discrepancy: "negative",
  pending: "warning",
};

const QBO_TONE: Record<NonNullable<VendorInvoice["qboStatus"]>, StatusTone> = {
  synced: "positive",
  pending: "warning",
  unmatched: "neutral",
};

/** Who sent the invoice. Vendors and carriers share this column, so a carrier
    goes through CarrierName and both land on the same weight. */
function InvoiceParty({ id, className }: { id: string; className?: string }) {
  const vendor = getVendor(id);
  if (vendor) return <span className={cn("font-medium text-foreground", className)}>{vendor.name}</span>;
  if (getCarrier(id)) return <CarrierName carrierId={id} className={className} />;
  return <span className={cn("text-muted-foreground", className)}>{id}</span>;
}

/** Invoiced above quoted is money leaking out of the deal, so the sign — not
    the size — picks the tone. */
function Variance({ value }: { value: number }) {
  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        value > 0 && "text-status-negative-fg",
        value < 0 && "text-status-positive-fg",
        value === 0 && "text-muted-foreground",
      )}
    >
      {value > 0 ? "+" : ""}{money(value)}
    </span>
  );
}

/** The QuickBooks bill reference and how far it got. It keeps ref and chip on
    one line from md up, where a wrap would push every compact row past 36px. */
function QboState({ inv }: { inv: VendorInvoice }) {
  const state = inv.qboStatus ?? "unmatched";
  return (
    <span className="flex flex-wrap items-center gap-2 md:flex-nowrap">
      <span className="font-mono text-caption text-muted-foreground">{inv.qboRef ?? "—"}</span>
      <StatusBadge tone={QBO_TONE[state]} className="capitalize">{state}</StatusBadge>
    </span>
  );
}

/** One field of the stacked, below-md presentation of a row. */
function StackedField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-body text-foreground">{children}</dd>
    </>
  );
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

  const clearFilters = () => { setStatus("all"); setQbo("all"); };
  const activeFilters = (status === "all" ? 0 : 1) + (qbo === "all" ? 0 : 1);

  const totalInvoiced = VENDOR_INVOICES.reduce((s, inv) => s + invoiceTotals(inv).invoiced, 0);
  const discrepancies = VENDOR_INVOICES.filter((inv) => inv.status === "discrepancy").length;
  const notSynced = VENDOR_INVOICES.filter((inv) => inv.qboStatus !== "synced").length;

  return (
    <AdminGate>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Invoices"
          description="Reconcile every vendor invoice against its quoted rates and the linked QuickBooks bill — across all deals."
        />

        {/* Four across only from xl: at lg the sidebar leaves the content
            column ~740px, and at a quarter of that the total invoiced clips
            mid-figure. */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

        {/* The filters and the list they narrow are one block, closer to each
            other than to the KPIs above. */}
        <div className="flex flex-col gap-4">
          <FilterBar onReset={clearFilters} activeCount={activeFilters}>
            <FilterField label="Status" htmlFor="invoice-status">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="invoice-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="discrepancy">Discrepancy</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="QuickBooks" htmlFor="invoice-qbo">
              <Select value={qbo} onValueChange={setQbo}>
                <SelectTrigger id="invoice-qbo"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All QBO states</SelectItem>
                  <SelectItem value="synced">Synced</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="unmatched">Unmatched</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            {/* Given the height of a control, the count centres against the
                selects it sits beside — and still reads as a row of its own on
                the widths where the band wraps. */}
            <p
              role="status"
              aria-live="polite"
              className="flex h-11 items-center text-body tabular-nums text-muted-foreground sm:ml-auto"
            >
              {filtered.length} of {VENDOR_INVOICES.length} invoices
            </p>
          </FilterBar>

          {filtered.length === 0 ? (
            <EmptyState
              title="No invoices match these filters"
              description="No vendor invoice has both the status and the QuickBooks state you picked."
              action={
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <RotateCcw aria-hidden /> Clear filters
                </Button>
              }
            />
          ) : (
            <>
              {/* md+ : the three money figures keep a column each, so they can
                  be compared down the page. Everything that only identifies the
                  invoice — who billed, when it is due — rides as secondary text
                  in the cell it belongs to rather than widening the table.
                  Twelve columns never fit a phone, so below md the same fields
                  are stacked instead — see the list underneath. */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Invoice / vendor</TableHead>
                      <TableHead>Deal</TableHead>
                      <TableHead>Issued / due</TableHead>
                      <TableHead numeric>Quoted</TableHead>
                      <TableHead numeric>Invoiced</TableHead>
                      <TableHead numeric>Variance</TableHead>
                      <TableHead>Status / payment</TableHead>
                      <TableHead>QuickBooks</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((inv) => {
                      const totals = invoiceTotals(inv);
                      const deal = dealForInvoice(inv);
                      const dealHref = `/deals/${inv.dealId}`;
                      const cells = (
                        <>
                          <TableCell>
                            <span className="flex flex-col">
                              <span className="font-medium text-foreground">{inv.reference}</span>
                              {/* The size sits on the wrapper, not in the
                                  party's own className: cn() merges a custom
                                  text-* token and a text colour as one group
                                  and would drop the size. */}
                              <span className="text-caption">
                                <InvoiceParty
                                  id={inv.vendorId}
                                  className="font-normal text-muted-foreground"
                                />
                              </span>
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[220px]">
                            {deal ? (
                              <Link
                                href={dealHref}
                                className="block truncate text-primary hover:underline"
                                title={deal.title}
                              >
                                {deal.title}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">{inv.dealId}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <span className="flex flex-col">
                              <span>{fmtDate(inv.issuedAt)}</span>
                              <span className="text-caption">Due {fmtDate(inv.dueDate)}</span>
                            </span>
                          </TableCell>
                          <TableCell numeric>{money(totals.quoted)}</TableCell>
                          <TableCell numeric>{money(totals.invoiced)}</TableCell>
                          <TableCell numeric><Variance value={totals.variance} /></TableCell>
                          <TableCell>
                            {/* Reconciliation and payment are two facts about
                                the same bill; side by side they stay one read
                                and the row keeps its 52px. */}
                            <span className="flex items-center gap-2">
                              <StatusBadge tone={STATUS_TONE[inv.status]} className="capitalize">
                                {inv.status}
                              </StatusBadge>
                              <StatusBadge tone={inv.paid ? "positive" : "neutral"}>
                                {inv.paid ? "Paid" : "Unpaid"}
                              </StatusBadge>
                            </span>
                          </TableCell>
                          <TableCell><QboState inv={inv} /></TableCell>
                          <TableCell className="text-right">
                            {deal ? (
                              <Button asChild size="sm" variant="ghost" className="px-2">
                                <Link
                                  href={dealHref}
                                  aria-label={`See details for invoice ${inv.reference}`}
                                >
                                  See Details <ArrowRight aria-hidden className="size-4" />
                                </Link>
                              </Button>
                            ) : (
                              // Nothing to open, so nothing is offered: the row
                              // says why rather than linking to a dead page.
                              <span className="text-caption text-muted-foreground">No deal on file</span>
                            )}
                          </TableCell>
                        </>
                      );
                      // An invoice has no record page of its own: its deal is
                      // where the line-by-line reconciliation lives, and that is
                      // the one place every link in the row already points. A row
                      // whose deal is missing stays inert rather than guessing.
                      return deal ? (
                        <LinkedTableRow key={inv.id} href={dealHref}>{cells}</LinkedTableRow>
                      ) : (
                        <TableRow key={inv.id}>{cells}</TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <Card asChild className="md:hidden">
                <ul>
                  {filtered.map((inv) => {
                    const totals = invoiceTotals(inv);
                    const deal = dealForInvoice(inv);
                    const dealHref = `/deals/${inv.dealId}`;
                    return (
                      <li
                        key={inv.id}
                        className="flex flex-col gap-3 border-b border-[var(--c-table-border)] p-4 last:border-b-0"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 truncate text-body font-medium text-foreground">
                            {inv.reference}
                          </p>
                          <StatusBadge tone={STATUS_TONE[inv.status]} className="shrink-0 capitalize">
                            {inv.status}
                          </StatusBadge>
                        </div>
                        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                          <StackedField label="Deal">
                            {deal ? (
                              <Link href={dealHref} className="block truncate text-primary">
                                {deal.title}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">{inv.dealId}</span>
                            )}
                          </StackedField>
                          <StackedField label="Vendor"><InvoiceParty id={inv.vendorId} /></StackedField>
                          <StackedField label="Issued">{fmtDate(inv.issuedAt)}</StackedField>
                          <StackedField label="Due">{fmtDate(inv.dueDate)}</StackedField>
                          <StackedField label="Quoted">
                            <span className="tabular-nums">{money(totals.quoted)}</span>
                          </StackedField>
                          <StackedField label="Invoiced">
                            <span className="tabular-nums">{money(totals.invoiced)}</span>
                          </StackedField>
                          <StackedField label="Variance"><Variance value={totals.variance} /></StackedField>
                          <StackedField label="QuickBooks"><QboState inv={inv} /></StackedField>
                          <StackedField label="Paid">
                            <StatusBadge tone={inv.paid ? "positive" : "neutral"}>
                              {inv.paid ? "Paid" : "Unpaid"}
                            </StatusBadge>
                          </StackedField>
                        </dl>
                        {deal ? (
                          <Button asChild variant="outline" className="w-full">
                            <Link href={dealHref} aria-label={`See details for invoice ${inv.reference}`}>
                              See Details <ArrowRight aria-hidden className="size-4" />
                            </Link>
                          </Button>
                        ) : (
                          <p className="text-caption text-muted-foreground">
                            No deal on file for this invoice.
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </>
          )}
        </div>
      </div>
    </AdminGate>
  );
}
