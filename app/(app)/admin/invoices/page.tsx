"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FileText, DollarSign, AlertTriangle, RefreshCcw, ExternalLink, RotateCcw,
} from "lucide-react";
import { AdminGate } from "@/components/admin-gate";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { CarrierName } from "@/components/carrier-name";
import { LinkedTableRow } from "@/components/linked-table-row";
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
function InvoiceParty({ id }: { id: string }) {
  const vendor = getVendor(id);
  if (vendor) return <span className="font-medium text-foreground">{vendor.name}</span>;
  if (getCarrier(id)) return <CarrierName carrierId={id} />;
  return <span className="text-muted-foreground">{id}</span>;
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

/** A toolbar filter. The title sits 10px above its control at body size in the
    foreground — the spacing the rate filters settled on. */
function FilterGroup({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2.5 block text-body font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

/** One field of the stacked, below-md presentation of a row. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
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

        <Card className="gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end">
          <FilterGroup id="invoice-status" label="Status">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="invoice-status" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="discrepancy">Discrepancy</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </FilterGroup>
          <FilterGroup id="invoice-qbo" label="QuickBooks">
            <Select value={qbo} onValueChange={setQbo}>
              <SelectTrigger id="invoice-qbo" className="w-full sm:w-[180px]">
                <SelectValue placeholder="QuickBooks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All QBO states</SelectItem>
                <SelectItem value="synced">Synced</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="unmatched">Unmatched</SelectItem>
              </SelectContent>
            </Select>
          </FilterGroup>
          {/* Given the height of a control, the count centres against the
              selects it sits beside — and still reads as a row of its own on
              the widths where the toolbar wraps. */}
          <p
            role="status"
            aria-live="polite"
            className="text-body tabular-nums text-muted-foreground sm:ml-auto sm:flex sm:h-11 sm:items-center"
          >
            {filtered.length} of {VENDOR_INVOICES.length} invoices
          </p>
        </Card>

        {filtered.length === 0 ? (
          <EmptyState
            title="No invoices match these filters"
            description="No vendor invoice has both the status and the QuickBooks state you picked."
            action={
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <RotateCcw className="size-4" /> Clear filters
              </Button>
            }
          />
        ) : (
          <>
            {/* md+ : one column per figure, so the money columns can be read
                down the page. Twelve columns never fit a phone, so below md the
                same fields are stacked instead — see the list underneath. */}
            <div className="hidden md:block">
              <Table density="compact">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Reference</TableHead>
                    <TableHead>Deal</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead numeric>Quoted</TableHead>
                    <TableHead numeric>Invoiced</TableHead>
                    <TableHead numeric>Variance</TableHead>
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
                    const dealHref = `/deals/${inv.dealId}`;
                    const cells = (
                      <>
                        <TableCell className="font-medium">{inv.reference}</TableCell>
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
                        <TableCell><InvoiceParty id={inv.vendorId} /></TableCell>
                        <TableCell className="text-muted-foreground">{fmtDate(inv.issuedAt)}</TableCell>
                        <TableCell className="text-muted-foreground">{fmtDate(inv.dueDate)}</TableCell>
                        <TableCell numeric>{money(totals.quoted)}</TableCell>
                        <TableCell numeric>{money(totals.invoiced)}</TableCell>
                        <TableCell numeric><Variance value={totals.variance} /></TableCell>
                        <TableCell>
                          <StatusBadge tone={STATUS_TONE[inv.status]} className="capitalize">
                            {inv.status}
                          </StatusBadge>
                        </TableCell>
                        <TableCell><QboState inv={inv} /></TableCell>
                        <TableCell>
                          <StatusBadge tone={inv.paid ? "positive" : "neutral"}>
                            {inv.paid ? "Paid" : "Unpaid"}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="ghost">
                            <Link href={dealHref} aria-label={`Open the deal for invoice ${inv.reference}`}>
                              <ExternalLink className="size-4" />
                              Open deal
                            </Link>
                          </Button>
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
                        <Field label="Deal">
                          {deal ? (
                            <Link href={dealHref} className="block truncate text-primary">
                              {deal.title}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">{inv.dealId}</span>
                          )}
                        </Field>
                        <Field label="Vendor"><InvoiceParty id={inv.vendorId} /></Field>
                        <Field label="Issued">{fmtDate(inv.issuedAt)}</Field>
                        <Field label="Due">{fmtDate(inv.dueDate)}</Field>
                        <Field label="Quoted">
                          <span className="tabular-nums">{money(totals.quoted)}</span>
                        </Field>
                        <Field label="Invoiced">
                          <span className="tabular-nums">{money(totals.invoiced)}</span>
                        </Field>
                        <Field label="Variance"><Variance value={totals.variance} /></Field>
                        <Field label="QuickBooks"><QboState inv={inv} /></Field>
                        <Field label="Paid">
                          <StatusBadge tone={inv.paid ? "positive" : "neutral"}>
                            {inv.paid ? "Paid" : "Unpaid"}
                          </StatusBadge>
                        </Field>
                      </dl>
                      <Button asChild variant="outline" className="w-full">
                        <Link href={dealHref} aria-label={`Open the deal for invoice ${inv.reference}`}>
                          <ExternalLink className="size-4" />
                          Open deal
                        </Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </>
        )}
      </div>
    </AdminGate>
  );
}
