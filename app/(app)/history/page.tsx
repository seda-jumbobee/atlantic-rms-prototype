"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Calculator, ExternalLink, Pencil } from "lucide-react";

import { QUOTE_HISTORY, CALC_HISTORY, USERS, getUser } from "@/lib/data";
import type { QuoteHistoryItem } from "@/lib/data";
import type { ShipmentType } from "@/lib/types";
import { encodeSearch } from "@/lib/search-params";
import { money, fmtDate, relativeAge } from "@/lib/format";
import { cn } from "@/lib/utils";

// Resolve a history lane back into Quote Master search params so a saved quote can be reopened & edited.
const PORT_BY_CITY: Record<string, string> = {
  Shanghai: "p-cnsha", Arica: "p-clari", Alexandria: "p-egaly", "Zárate": "p-arzae",
  Melbourne: "p-aumel", Southampton: "p-gbsou", Genoa: "p-itgoa", "Jebel Ali": "p-aedxb", Aqaba: "p-joaqj",
  Houston: "p-ushou", Baltimore: "p-usbal", Savannah: "p-ussav", Miami: "p-usjax",
  "Fort Lauderdale": "p-usjax", Amarillo: "p-ushou", Charleston: "p-ushou", Hutchinson: "p-ushou",
};
function resolvePort(loc: string): string | undefined {
  return PORT_BY_CITY[loc.split(",")[0].trim()];
}
function shipmentFromLabel(s: string): ShipmentType {
  const l = s.toLowerCase();
  if (l.includes("roro")) return "RoRo";
  if (l.includes("flat")) return "Flatrack";
  if (l.includes("reefer")) return "Reefer";
  if (l.includes("break")) return "Breakbulk";
  if (l.includes("lcl")) return "LCL";
  if (l.includes("air")) return "Air";
  return "Container";
}
function reopenHref(q: QuoteHistoryItem): string {
  const op = resolvePort(q.origin), dp = resolvePort(q.destination);
  if (!op || !dp) return "/quote-master";
  const qs = encodeSearch({
    originPortId: op, destPortId: dp,
    commodityKind: q.commodityKind, commodityLabel: q.commodity,
    shipmentType: shipmentFromLabel(q.shipmentType), advancedSearch: false,
  });
  return `/quote-master?${qs}&edit=1`;
}

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { QuoteStatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const QUOTE_STATUSES = ["draft", "sent", "confirmed", "lost"] as const;

function ManagerCell({ managerId }: { managerId: string }) {
  const u = getUser(managerId);
  if (!u) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full text-caption font-semibold text-white"
        style={{ backgroundColor: u.avatarColor }}
      >
        {u.initials}
      </span>
      <span className="truncate text-sm">{u.name}</span>
    </div>
  );
}

export default function HistoryPage() {
  const [status, setStatus] = useState<string>("all");
  const [quoteManager, setQuoteManager] = useState<string>("all");
  const [calcManager, setCalcManager] = useState<string>("all");

  const quotes = useMemo(
    () =>
      QUOTE_HISTORY.filter(
        (q) =>
          (status === "all" || q.status === status) &&
          (quoteManager === "all" || q.managerId === quoteManager)
      ),
    [status, quoteManager]
  );

  const calcs = useMemo(
    () =>
      CALC_HISTORY.filter(
        (c) => calcManager === "all" || c.managerId === calcManager
      ),
    [calcManager]
  );

  const quoteCount = quotes.length;
  const quoteValue = quotes.reduce((sum, q) => sum + q.total, 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="History"
        description="Past quotes and calculator runs across the team."
      />

      <Tabs defaultValue="quotes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="quotes" className="gap-1.5">
            <FileText className="size-4" />
            Quotes
          </TabsTrigger>
          <TabsTrigger value="calculations" className="gap-1.5">
            <Calculator className="size-4" />
            Calculations
          </TabsTrigger>
        </TabsList>

        {/* QUOTES */}
        <TabsContent value="quotes" className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Quotes shown"
              value={String(quoteCount)}
              sub="matching filters"
              icon={FileText}
              accent="primary"
            />
            <StatCard
              label="Total value"
              value={money(quoteValue)}
              sub="sum of quoted totals"
              accent="success"
            />
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {QUOTE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Manager</Label>
              <Select value={quoteManager} onValueChange={setQuoteManager}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="All managers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All managers</SelectItem>
                  {USERS.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Lane</TableHead>
                    <TableHead>Shipment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell>
                        <div className="font-mono text-xs font-medium">
                          {q.dealId ? (
                            <Link
                              href={`/deals/${q.dealId}`}
                              className="text-primary hover:underline"
                            >
                              {q.id}
                            </Link>
                          ) : (
                            q.id
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {q.customer}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[18rem]">
                        <span className="text-sm">{q.commodity}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {q.origin}
                        <span className="text-muted-foreground"> → </span>
                        {q.destination}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {q.shipmentType}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {money(q.total)}
                      </TableCell>
                      <TableCell>
                        <QuoteStatusBadge status={q.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <ManagerCell managerId={q.managerId} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        <span title={fmtDate(q.createdAt)}>
                          {relativeAge(q.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {q.dealId && (
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                            >
                              <Link href={`/deals/${q.dealId}`}>
                                <ExternalLink className="size-4" />
                                Deal
                              </Link>
                            </Button>
                          )}
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                          >
                            <Link href={reopenHref(q)}>
                              <Pencil className="size-4" />
                              Edit &amp; resend
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {quotes.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No quotes match the selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CALCULATIONS */}
        <TabsContent value="calculations" className="space-y-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Manager</Label>
              <Select value={calcManager} onValueChange={setCalcManager}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="All managers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All managers</SelectItem>
                  {USERS.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Run</TableHead>
                    <TableHead>Calculator</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead className="text-right">Result</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calcs.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs font-medium">
                        {c.id}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm font-medium">
                        {c.calculator}
                      </TableCell>
                      <TableCell className="max-w-[24rem] text-sm text-muted-foreground">
                        {c.summary}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">
                        {c.unit ? (
                          <span>
                            <span className="font-medium">{c.result}</span>{" "}
                            <span className="text-xs text-muted-foreground">
                              {c.unit}
                            </span>
                          </span>
                        ) : (
                          <span className="font-medium">{money(c.result)}</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <ManagerCell managerId={c.managerId} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        <span title={fmtDate(c.createdAt)}>
                          {relativeAge(c.createdAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {calcs.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className={cn(
                          "py-10 text-center text-sm text-muted-foreground"
                        )}
                      >
                        No calculations match the selected manager.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
