"use client";

import { useState } from "react";
import { FileText, ScanLine, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getVendor, getInvoicesForDeal, dataSourcesForVendor } from "@/lib/data";
import { money, fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { VendorInvoice } from "@/lib/types";

/** Resolve the data source a quoted line came from. */
function sourceFor(vendorId?: string): string {
  if (!vendorId) return "Front import";
  return dataSourcesForVendor(vendorId)[0]?.name ?? "Front import";
}

type ReviewTarget = {
  description: string;
  quoted: number;
  invoiced: number;
  source: string;
  vendorName: string;
  reference: string;
};

const STATUS_TONE: Record<VendorInvoice["status"], StatusTone> = {
  matched: "positive",
  discrepancy: "negative",
  pending: "warning",
};

function Variance({ value }: { value: number }) {
  if (value === 0) return <span className="text-muted-foreground tabular-nums">—</span>;
  const positive = value > 0;
  return (
    <span className={cn("tabular-nums font-medium", positive ? "text-destructive" : "text-success")}>
      {positive ? "+" : "−"}
      {money(Math.abs(value))}
    </span>
  );
}

export function InvoiceComparison({ dealId }: { dealId: string }) {
  const invoices = getInvoicesForDeal(dealId);
  const [review, setReview] = useState<ReviewTarget | null>(null);
  const [note, setNote] = useState("");

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanLine className="size-4 text-primary" /> Invoice reconciliation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No vendor invoices received yet. Once vendors invoice this deal, lines are matched
            against the quoted costs and synced to QuickBooks.
          </p>
        </CardContent>
      </Card>
    );
  }

  const allLines = invoices.flatMap((i) => i.lines);
  const totalQuoted = allLines.reduce((s, l) => s + l.quoted, 0);
  const totalInvoiced = allLines.reduce((s, l) => s + l.invoiced, 0);
  const totalVariance = totalInvoiced - totalQuoted;

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle className="flex items-center gap-2 text-base">
          <ScanLine className="size-4 text-primary" /> Invoice reconciliation
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Vendor invoices matched against quoted costs and reconciled in QuickBooks.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {invoices.map((inv) => {
          const vendor = getVendor(inv.vendorId);
          const qSum = inv.lines.reduce((s, l) => s + l.quoted, 0);
          const iSum = inv.lines.reduce((s, l) => s + l.invoiced, 0);
          return (
            <div key={inv.id} className="rounded-lg border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{vendor?.name ?? inv.vendorId}</span>
                  <span className="text-xs text-muted-foreground">· {inv.reference}</span>
                  <span className="text-xs text-muted-foreground">· {fmtDate(inv.issuedAt)}</span>
                </div>
                <StatusBadge tone={STATUS_TONE[inv.status]} dot={false} className="capitalize">
                  {inv.status}
                </StatusBadge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Quoted</TableHead>
                    <TableHead className="text-right">Invoiced</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead className="text-right">Review</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inv.lines.map((line, idx) => {
                    const lineVendor = getVendor(line.vendorId ?? inv.vendorId);
                    const source = sourceFor(line.vendorId ?? inv.vendorId);
                    const diff = line.invoiced - line.quoted;
                    return (
                      <TableRow key={`${inv.id}-${idx}`}>
                        <TableCell>
                          <div className="text-sm">{line.description}</div>
                          {lineVendor && (
                            <div className="text-xs text-muted-foreground">{lineVendor.name}</div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Database className="size-3.5 shrink-0" />
                            <span className="truncate" title={source}>{source}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{money(line.quoted)}</TableCell>
                        <TableCell className="text-right tabular-nums">{money(line.invoiced)}</TableCell>
                        <TableCell className="text-right">
                          <Variance value={diff} />
                        </TableCell>
                        <TableCell className="text-right">
                          {diff !== 0 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setNote("");
                                setReview({
                                  description: line.description,
                                  quoted: line.quoted,
                                  invoiced: line.invoiced,
                                  source,
                                  vendorName: lineVendor?.name ?? vendor?.name ?? inv.vendorId,
                                  reference: inv.reference,
                                });
                              }}
                            >
                              Review
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="border-t-2 bg-muted/30 font-medium">
                    <TableCell className="text-sm" colSpan={2}>Subtotal</TableCell>
                    <TableCell className="text-right tabular-nums">{money(qSum)}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(iSum)}</TableCell>
                    <TableCell className="text-right">
                      <Variance value={iSum - qSum} />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          );
        })}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
          <div className="text-sm">
            <span className="text-muted-foreground">Total quoted</span>{" "}
            <span className="font-semibold tabular-nums">{money(totalQuoted)}</span>
            <span className="mx-2 text-muted-foreground">vs invoiced</span>
            <span className="font-semibold tabular-nums">{money(totalInvoiced)}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Net variance </span>
            <Variance value={totalVariance} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {totalVariance > 0
            ? `Invoiced totals exceed quoted by ${money(totalVariance)}. Flagged for QuickBooks review before payment.`
            : "All lines reconcile within tolerance. Synced to QuickBooks."}
        </p>
      </CardContent>

      <Dialog open={review !== null} onOpenChange={(o) => !o && setReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review line variance</DialogTitle>
            <DialogDescription>
              {review?.vendorName} · {review?.reference}
            </DialogDescription>
          </DialogHeader>
          {review && (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                {review.description}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xs text-muted-foreground">Quoted</div>
                  <div className="font-semibold tabular-nums">{money(review.quoted)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Invoiced</div>
                  <div className="font-semibold tabular-nums">{money(review.invoiced)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Variance</div>
                  <div className="font-semibold">
                    <Variance value={review.invoiced - review.quoted} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs text-muted-foreground">
                <Database className="size-3.5 shrink-0" />
                <span>Quoted rate sourced from <span className="font-medium text-foreground">{review.source}</span></span>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="review-note">Note</Label>
                <Textarea
                  id="review-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a reconciliation note for finance…"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                toast.error("Line disputed — vendor notified, held from QuickBooks payment.");
                setReview(null);
              }}
            >
              Dispute
            </Button>
            <Button
              onClick={() => {
                toast.success("Variance approved — synced to QuickBooks for payment.");
                setReview(null);
              }}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
