"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText, Calculator, ExternalLink, Pencil, Search as SearchIcon, MoreVertical, Send,
  Copy, LayoutTemplate, Briefcase, RotateCcw, X, AlertTriangle, EyeOff, History as HistoryIcon,
  Route as RouteIcon, ListChecks, ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

import {
  QUOTE_HISTORY, CALC_HISTORY, getQuoteHistoryItem,
  type QuoteHistoryItem, type CalcHistoryItem, type QuoteHistoryType,
} from "@/lib/data/history";
import { QUOTE_TEMPLATES } from "@/lib/data/templates";
import { money, fmtDate, relativeAge } from "@/lib/format";
import { cn } from "@/lib/utils";
import { reopenHref, duplicateHref, calculatorHref, needsAttention } from "@/lib/quote-links";
import { useSession } from "@/components/session-provider";
import type { QuoteStatus } from "@/lib/types";

import { PageHeader } from "@/components/page-header";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequiredMark } from "@/components/ui/field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CreateDealDialog } from "@/components/deals/create-deal-dialog";

// ── status + type labels (real backend statuses only, mapped to clear copy) ──
const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft", sent: "Sent", confirmed: "Won", lost: "Lost", expired: "Expired",
};
const STATUS_TONE: Record<QuoteStatus, StatusTone> = {
  draft: "neutral", sent: "info", confirmed: "positive", lost: "negative", expired: "warning",
};
const STATUS_HELP: Record<QuoteStatus, string> = {
  draft: "Saved but not sent to the client yet.",
  sent: "Sent to the client — awaiting a response.",
  confirmed: "The client accepted and the deal was won.",
  lost: "The client declined or the deal was lost.",
  expired: "The quoted rate validity has passed.",
};
const QUOTE_STATUSES: QuoteStatus[] = ["draft", "sent", "confirmed", "lost", "expired"];

const TYPE_LABEL: Record<QuoteHistoryType, string> = { "rate-quote": "Rate Quote", "custom-route": "Custom Route" };
const TYPE_ICON: Record<QuoteHistoryType, typeof ListChecks> = { "rate-quote": ListChecks, "custom-route": RouteIcon };

function QuoteStatusChip({ status }: { status: QuoteStatus }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} role="note" aria-label={`Status: ${STATUS_LABEL[status]}. ${STATUS_HELP[status]}`} className="inline-flex rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <StatusBadge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</StatusBadge>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-56">{STATUS_HELP[status]}</TooltipContent>
    </Tooltip>
  );
}

function TypeBadge({ type }: { type: QuoteHistoryType }) {
  const Icon = TYPE_ICON[type];
  return <Badge variant={type === "rate-quote" ? "status-info" : "status-positive"} className="gap-1"><Icon className="size-3" /> {TYPE_LABEL[type]}</Badge>;
}

function RouteCell({ q, className }: { q: QuoteHistoryItem; className?: string }) {
  const full = `${q.origin} → ${q.destination}`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className={cn("block max-w-[13rem] truncate rounded text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", className)}>
          {q.origin.split(",")[0]}<span className="text-muted-foreground"> → </span>{q.destination.split(",")[0]}
        </span>
      </TooltipTrigger>
      <TooltipContent>{full}</TooltipContent>
    </Tooltip>
  );
}

// ── filters / sorting ─────────────────────────────────────────────────────────
type Tab = "all" | "quotes" | "calculations";
type StatusFilter = "all" | "active" | "attention" | QuoteStatus;
type RangeFilter = "all" | "7d" | "30d" | "90d";
type QuoteSort = "updated" | "created" | "oldest" | "value-desc" | "value-asc";
type CalcSort = "recent" | "oldest" | "name";
type LinkedFilter = "all" | "linked" | "not-linked";

const RANGE_LABEL: Record<RangeFilter, string> = { all: "Any date", "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days" };
const NOW = new Date("2026-06-23T12:00:00Z").getTime(); // mock-data "today" (matches lib/format)
const inRange = (iso: string, r: RangeFilter) =>
  r === "all" || NOW - new Date(iso).getTime() <= { "7d": 7, "30d": 30, "90d": 90 }[r] * 86_400_000;

const QUOTE_SORTS: { value: QuoteSort; label: string }[] = [
  { value: "updated", label: "Recently updated" },
  { value: "created", label: "Recently created" },
  { value: "oldest", label: "Oldest first" },
  { value: "value-desc", label: "Quote value: high to low" },
  { value: "value-asc", label: "Quote value: low to high" },
];
const QUOTE_SORT_FNS: Record<QuoteSort, (a: QuoteHistoryItem, b: QuoteHistoryItem) => number> = {
  updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  created: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  "value-desc": (a, b) => b.total - a.total,
  "value-asc": (a, b) => a.total - b.total,
};
const CALC_SORTS: { value: CalcSort; label: string }[] = [
  { value: "recent", label: "Recently calculated" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name: A–Z" },
];
const CALC_SORT_FNS: Record<CalcSort, (a: CalcHistoryItem, b: CalcHistoryItem) => number> = {
  recent: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  name: (a, b) => a.calculator.localeCompare(b.calculator),
};

const matchesStatus = (q: QuoteHistoryItem, s: StatusFilter) =>
  s === "all" ? true
  : s === "active" ? q.status === "draft" || q.status === "sent"
  : s === "attention" ? needsAttention(q, NOW)
  : q.status === s;

const quoteBlob = (q: QuoteHistoryItem) =>
  [q.id, q.customer, q.origin, q.destination, q.commodity, q.shipmentType, TYPE_LABEL[q.quoteType]].join(" ").toLowerCase();
const calcBlob = (c: CalcHistoryItem) =>
  [c.id, c.calculator, c.summary, c.relatedQuoteId ?? ""].join(" ").toLowerCase();

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

const TAB_KEY = "history-tab";

// ── page ─────────────────────────────────────────────────────────────────────
function HistoryContent() {
  const sp = useSearchParams();
  const { user } = useSession();

  // Deep links: ?tab=quotes|calculations, ?status=… (dashboard), ?record=Q-…/C-…
  const spTab = sp.get("tab");
  const spStatus = sp.get("status") ?? "";
  const spRecord = sp.get("record");
  const validStatus = new Set<string>(["active", "attention", ...QUOTE_STATUSES]);

  const [tab, setTab] = useState<Tab>(() => {
    if (spTab === "calculations" || spTab === "quotes") return spTab;
    if (validStatus.has(spStatus)) return "quotes";
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(TAB_KEY);
      if (saved === "all" || saved === "quotes" || saved === "calculations") return saved;
    }
    return "all";
  });
  const setTabPersist = (t: Tab) => { setTab(t); if (typeof window !== "undefined") sessionStorage.setItem(TAB_KEY, t); };

  const [searchRaw, setSearchRaw] = useState("");
  const search = useDebounced(searchRaw, 250).trim().toLowerCase();

  // quote filters
  const [status, setStatus] = useState<StatusFilter>(validStatus.has(spStatus) ? (spStatus as StatusFilter) : "all");
  const [quoteType, setQuoteType] = useState<"all" | QuoteHistoryType>("all");
  const [customer, setCustomer] = useState("all");
  const [quoteRange, setQuoteRange] = useState<RangeFilter>("all");
  const [quoteSort, setQuoteSort] = useState<QuoteSort>("updated");
  // calc filters
  const [calcType, setCalcType] = useState("all");
  const [calcRange, setCalcRange] = useState<RangeFilter>("all");
  const [linked, setLinked] = useState<LinkedFilter>("all");
  const [calcSort, setCalcSort] = useState<CalcSort>("recent");

  // ── ownership: a Manager sees only their own records ──
  const myQuotes = useMemo(() => QUOTE_HISTORY.filter((q) => q.managerId === user?.id), [user]);
  const myCalcs = useMemo(() => CALC_HISTORY.filter((c) => c.managerId === user?.id), [user]);

  // record deep link — enforce ownership before opening anything
  const [openQuote, setOpenQuote] = useState<QuoteHistoryItem | null>(null);
  const [openCalc, setOpenCalc] = useState<CalcHistoryItem | null>(null);
  const [denied, setDenied] = useState(false);
  useEffect(() => {
    if (!spRecord || !user) return;
    const q = QUOTE_HISTORY.find((x) => x.id === spRecord);
    const c = CALC_HISTORY.find((x) => x.id === spRecord);
    const rec = q ?? c;
    if (!rec) return;
    if (rec.managerId !== user.id) { setDenied(true); return; } // never expose details
    if (q) setOpenQuote(q); else if (c) setOpenCalc(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spRecord, user?.id]);

  const customers = useMemo(() => Array.from(new Set(myQuotes.map((q) => q.customer))).sort(), [myQuotes]);
  const calcNames = useMemo(() => Array.from(new Set(myCalcs.map((c) => c.calculator))).sort(), [myCalcs]);

  const quotes = useMemo(() => {
    let out = myQuotes.filter((q) => matchesStatus(q, status));
    if (quoteType !== "all") out = out.filter((q) => q.quoteType === quoteType);
    if (customer !== "all") out = out.filter((q) => q.customer === customer);
    out = out.filter((q) => inRange(q.createdAt, quoteRange));
    if (search) out = out.filter((q) => quoteBlob(q).includes(search));
    return [...out].sort(QUOTE_SORT_FNS[quoteSort]);
  }, [myQuotes, status, quoteType, customer, quoteRange, search, quoteSort]);

  const calcs = useMemo(() => {
    let out = myCalcs;
    if (calcType !== "all") out = out.filter((c) => c.calculator === calcType);
    if (linked !== "all") out = out.filter((c) => (linked === "linked" ? !!c.relatedQuoteId : !c.relatedQuoteId));
    out = out.filter((c) => inRange(c.createdAt, calcRange));
    if (search) out = out.filter((c) => calcBlob(c).includes(search));
    return [...out].sort(CALC_SORT_FNS[calcSort]);
  }, [myCalcs, calcType, calcRange, linked, search, calcSort]);

  // active-filter chips (per relevant tab)
  const quoteChips = [
    status !== "all" && { key: "status", label: status === "active" ? "Active (draft + sent)" : status === "attention" ? "Needs attention" : `Status: ${STATUS_LABEL[status as QuoteStatus]}`, clear: () => setStatus("all") },
    quoteType !== "all" && { key: "type", label: TYPE_LABEL[quoteType as QuoteHistoryType], clear: () => setQuoteType("all") },
    customer !== "all" && { key: "customer", label: customer, clear: () => setCustomer("all") },
    quoteRange !== "all" && { key: "range", label: RANGE_LABEL[quoteRange], clear: () => setQuoteRange("all") },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];
  const calcChips = [
    calcType !== "all" && { key: "ctype", label: calcType, clear: () => setCalcType("all") },
    linked !== "all" && { key: "linked", label: linked === "linked" ? "Linked to a quote" : "Not linked", clear: () => setLinked("all") },
    calcRange !== "all" && { key: "crange", label: RANGE_LABEL[calcRange], clear: () => setCalcRange("all") },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  const chips = tab === "quotes" ? quoteChips : tab === "calculations" ? calcChips : [...quoteChips, ...calcChips];
  const filtersActive = chips.length > 0 || search !== "";
  const clearFilters = () => {
    setStatus("all"); setQuoteType("all"); setCustomer("all"); setQuoteRange("all");
    setCalcType("all"); setLinked("all"); setCalcRange("all"); setSearchRaw("");
  };

  const noHistoryAtAll = myQuotes.length === 0 && myCalcs.length === 0;
  const resultCount = tab === "quotes" ? quotes.length : tab === "calculations" ? calcs.length : quotes.length + calcs.length;

  return (
    <div className="space-y-6">
      <PageHeader title="My History" description="Review your saved quotes and completed calculations." />

      {denied && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>You don’t have access to this record.</AlertTitle>
          <AlertDescription>It may belong to another manager. Records below are your own.</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTabPersist(v as Tab)}>
        <div className="-mx-1 overflow-x-auto px-1">
          <TabsList>
            <TabsTrigger value="all">All <Count n={myQuotes.length + myCalcs.length} /></TabsTrigger>
            <TabsTrigger value="quotes">Quotes <Count n={myQuotes.length} /></TabsTrigger>
            <TabsTrigger value="calculations">Calculations <Count n={myCalcs.length} /></TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {noHistoryAtAll ? (
        <EmptyState
          title="No history yet"
          description="Saved quotes and completed calculations will appear here."
          actions={
            <>
              <Button asChild><Link href="/quote-master">Create rate quote</Link></Button>
              <Button asChild variant="outline"><Link href="/route-builder">Build custom route</Link></Button>
              <Button asChild variant="outline"><Link href="/calculators">Open calculators</Link></Button>
            </>
          }
        />
      ) : (
        <>
          {/* Search + filters + sort */}
          <div className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-xs">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={searchRaw} onChange={(e) => setSearchRaw(e.target.value)} placeholder="Search history" className="pl-8" aria-label="Search history" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(tab === "quotes" || tab === "all") && (
                  <>
                    <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
                      <SelectTrigger size="sm" className="w-36" aria-label="Filter by status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="active">Active (draft + sent)</SelectItem>
                        <SelectItem value="attention">Needs attention</SelectItem>
                        {QUOTE_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={quoteType} onValueChange={(v) => setQuoteType(v as "all" | QuoteHistoryType)}>
                      <SelectTrigger size="sm" className="w-36" aria-label="Filter by quote type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All quote types</SelectItem>
                        <SelectItem value="rate-quote">Rate Quote</SelectItem>
                        <SelectItem value="custom-route">Custom Route</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
                {tab === "quotes" && (
                  <>
                    <Select value={customer} onValueChange={setCustomer}>
                      <SelectTrigger size="sm" className="w-40" aria-label="Filter by customer"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All customers</SelectItem>
                        {customers.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={quoteRange} onValueChange={(v) => setQuoteRange(v as RangeFilter)}>
                      <SelectTrigger size="sm" className="w-36" aria-label="Filter by date range"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(RANGE_LABEL) as RangeFilter[]).map((r) => <SelectItem key={r} value={r}>{RANGE_LABEL[r]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="q-sort" className="hidden text-xs text-muted-foreground sm:inline">Sort by</Label>
                      <Select value={quoteSort} onValueChange={(v) => setQuoteSort(v as QuoteSort)}>
                        <SelectTrigger id="q-sort" size="sm" className="w-52" aria-label="Sort quotes"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {QUOTE_SORTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                {tab === "calculations" && (
                  <>
                    <Select value={calcType} onValueChange={setCalcType}>
                      <SelectTrigger size="sm" className="w-44" aria-label="Filter by calculator"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All calculators</SelectItem>
                        {calcNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={linked} onValueChange={(v) => setLinked(v as LinkedFilter)}>
                      <SelectTrigger size="sm" className="w-36" aria-label="Filter by related quote"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any quote link</SelectItem>
                        <SelectItem value="linked">Linked</SelectItem>
                        <SelectItem value="not-linked">Not linked</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={calcRange} onValueChange={(v) => setCalcRange(v as RangeFilter)}>
                      <SelectTrigger size="sm" className="w-36" aria-label="Filter by date range"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(RANGE_LABEL) as RangeFilter[]).map((r) => <SelectItem key={r} value={r}>{RANGE_LABEL[r]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="c-sort" className="hidden text-xs text-muted-foreground sm:inline">Sort by</Label>
                      <Select value={calcSort} onValueChange={(v) => setCalcSort(v as CalcSort)}>
                        <SelectTrigger id="c-sort" size="sm" className="w-44" aria-label="Sort calculations"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CALC_SORTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* chips + count */}
            <div className="flex flex-wrap items-center gap-2">
              <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
                {resultCount} {resultCount === 1 ? "result" : "results"}
              </p>
              {chips.map((c) => (
                <Badge key={c.key} variant="secondary" className="gap-1 pr-1">
                  {c.label}
                  <button type="button" onClick={c.clear} aria-label={`Remove filter ${c.label}`} className="rounded-full p-0.5 outline-none hover:bg-muted-foreground/20 focus-visible:ring-[3px] focus-visible:ring-ring/50">
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              {filtersActive && (
                <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-muted-foreground" onClick={clearFilters}>
                  <RotateCcw className="size-3.5" /> Clear filters
                </Button>
              )}
            </div>
          </div>

          {/* content */}
          {(tab === "all" || tab === "quotes") && (
            <section aria-label="Quotes" className="space-y-2">
              {tab === "all" && <h2 className="text-sm font-semibold">Quotes</h2>}
              {quotes.length > 0 ? (
                <QuotesView quotes={quotes} onOpen={setOpenQuote} />
              ) : myQuotes.length === 0 ? (
                <EmptyState
                  title="No quotes yet"
                  description="Create a Rate Quote or Custom Route quote to see it here."
                  actions={
                    <>
                      <Button asChild size="sm"><Link href="/quote-master">Create rate quote</Link></Button>
                      <Button asChild size="sm" variant="outline"><Link href="/route-builder">Build custom route</Link></Button>
                    </>
                  }
                />
              ) : (
                <EmptyState
                  title="No history found"
                  description="Try another search or clear the filters."
                  actions={<Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>}
                />
              )}
            </section>
          )}

          {(tab === "all" || tab === "calculations") && (
            <section aria-label="Calculations" className="space-y-2">
              {tab === "all" && <h2 className="text-sm font-semibold">Calculations</h2>}
              {calcs.length > 0 ? (
                <CalcsView calcs={calcs} onOpen={setOpenCalc} />
              ) : myCalcs.length === 0 ? (
                <EmptyState
                  title="No calculations yet"
                  description="Completed calculator results will appear here."
                  actions={<Button asChild size="sm" variant="outline"><Link href="/calculators">Open calculators</Link></Button>}
                />
              ) : (
                <EmptyState
                  title="No history found"
                  description="Try another search or clear the filters."
                  actions={<Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>}
                />
              )}
            </section>
          )}
        </>
      )}

      <QuoteDetailsSheet quote={openQuote} onClose={() => setOpenQuote(null)} />
      <CalcDetailsSheet calc={openCalc} onClose={() => setOpenCalc(null)} onOpenQuote={(q) => { setOpenCalc(null); setOpenQuote(q); }} />
    </div>
  );
}

function Count({ n }: { n: number }) {
  return <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">{n}</span>;
}

function EmptyState({ title, description, actions }: { title: string; description: string; actions: React.ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 p-10 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground"><HistoryIcon className="size-6" /></div>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 pt-1">{actions}</div>
    </Card>
  );
}

// ── quotes: desktop table + mobile cards ─────────────────────────────────────
function QuoteActionsMenu({ q, onOpen }: { q: QuoteHistoryItem; onOpen: (q: QuoteHistoryItem) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label={`More actions for ${q.id}`} onClick={(e) => e.stopPropagation()}>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => onOpen(q)}><FileText className="size-4" /> View quote</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={reopenHref(q)}><Pencil className="size-4" /> {q.status === "draft" ? "Continue editing" : "Edit & resend"}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={duplicateHref(q)}><Copy className="size-4" /> Duplicate quote</Link>
        </DropdownMenuItem>
        {q.dealId && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/deals/${q.dealId}`}><Briefcase className="size-4" /> Open deal</Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function QuotesView({ quotes, onOpen }: { quotes: QuoteHistoryItem[]; onOpen: (q: QuoteHistoryItem) => void }) {
  return (
    <>
      {/* desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 bg-muted">Quote</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Route</TableHead>
              <TableHead className="text-right">Client total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last updated</TableHead>
              <TableHead className="sticky right-0 z-10 bg-muted text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((q) => (
              <TableRow key={q.id} className="cursor-pointer" onClick={() => onOpen(q)}>
                <TableCell className="sticky left-0 z-10 bg-card">
                  {/* the quote number opens the QUOTE record — never the deal */}
                  <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(q); }} className="rounded font-mono text-xs font-medium text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50">
                    {q.id}
                  </button>
                </TableCell>
                <TableCell><TypeBadge type={q.quoteType} /></TableCell>
                <TableCell className="max-w-[11rem] truncate text-sm" title={q.customer}>{q.customer}</TableCell>
                <TableCell><RouteCell q={q} /></TableCell>
                <TableCell className="text-right font-medium tabular-nums">{money(q.total)}</TableCell>
                <TableCell><QuoteStatusChip status={q.status} /></TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  <span title={fmtDate(q.updatedAt)}>{relativeAge(q.updatedAt)}</span>
                </TableCell>
                <TableCell className="sticky right-0 z-10 bg-card text-right" onClick={(e) => e.stopPropagation()}>
                  <QuoteActionsMenu q={q} onOpen={onOpen} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* mobile cards */}
      <div className="space-y-3 md:hidden">
        {quotes.map((q) => (
          <Card key={q.id} className="gap-0 p-0">
            <button type="button" onClick={() => onOpen(q)} className="block w-full rounded-t-xl p-4 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-medium text-primary">{q.id}</span>
                <QuoteStatusChip status={q.status} />
              </div>
              <div className="mt-1.5 truncate text-sm font-medium">{q.customer}</div>
              <RouteCell q={q} className="mt-0.5 max-w-full text-muted-foreground" />
            </button>
            <div className="flex items-center justify-between border-t px-4 py-2.5">
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold tabular-nums text-foreground">{money(q.total)}</span>
                <span className="mx-1.5">·</span>Updated {relativeAge(q.updatedAt)}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => onOpen(q)}>Open</Button>
                <QuoteActionsMenu q={q} onOpen={onOpen} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

// ── calculations: desktop table + mobile cards ───────────────────────────────
function calcResult(c: CalcHistoryItem) {
  const isCount = /teu|slot/i.test(c.unit ?? "");
  return isCount ? `${c.result} ${c.unit}` : money(c.result);
}

function CalcActionsMenu({ c, onOpen }: { c: CalcHistoryItem; onOpen: (c: CalcHistoryItem) => void }) {
  const copy = () => { navigator.clipboard?.writeText(`${c.calculator}: ${c.summary} → ${calcResult(c)}`); toast.success("Result copied"); };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label={`More actions for ${c.id}`} onClick={(e) => e.stopPropagation()}>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => onOpen(c)}><Calculator className="size-4" /> Open</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={calculatorHref(c)}><RotateCcw className="size-4" /> Recalculate</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copy}><Copy className="size-4" /> Copy result</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CalcsView({ calcs, onOpen }: { calcs: CalcHistoryItem[]; onOpen: (c: CalcHistoryItem) => void }) {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 bg-muted">Calculator</TableHead>
              <TableHead>Input summary</TableHead>
              <TableHead className="text-right">Result</TableHead>
              <TableHead>Related quote</TableHead>
              <TableHead>Calculated</TableHead>
              <TableHead className="sticky right-0 z-10 bg-muted text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calcs.map((c) => (
              <TableRow key={c.id} className="cursor-pointer" onClick={() => onOpen(c)}>
                <TableCell className="sticky left-0 z-10 whitespace-nowrap bg-card">
                  <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(c); }} className="rounded text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50">
                    {c.calculator}
                  </button>
                  <div className="font-mono text-caption text-muted-foreground">{c.id}</div>
                </TableCell>
                <TableCell className="max-w-[20rem] truncate text-sm text-muted-foreground" title={c.summary}>{c.summary}</TableCell>
                <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">{calcResult(c)}</TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {c.relatedQuoteId ? <span className="font-mono text-xs text-primary">{c.relatedQuoteId}</span> : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  <span title={fmtDate(c.createdAt)}>{relativeAge(c.createdAt)}</span>
                </TableCell>
                <TableCell className="sticky right-0 z-10 bg-card text-right" onClick={(e) => e.stopPropagation()}>
                  <CalcActionsMenu c={c} onOpen={onOpen} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {calcs.map((c) => (
          <Card key={c.id} className="gap-0 p-0">
            <button type="button" onClick={() => onOpen(c)} className="block w-full rounded-t-xl p-4 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{c.calculator}</span>
                <span className="font-semibold tabular-nums">{calcResult(c)}</span>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">{c.summary}</p>
            </button>
            <div className="flex items-center justify-between border-t px-4 py-2.5">
              <span className="text-xs text-muted-foreground">{relativeAge(c.createdAt)}</span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => onOpen(c)}>Open</Button>
                <CalcActionsMenu c={c} onOpen={onOpen} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

// ── quote details drawer ─────────────────────────────────────────────────────
function DetailRow({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 px-3 py-2 text-sm", !last && "border-b")}>
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium">{value}</span>
    </div>
  );
}

function SaveTemplateDialog({ open, onOpenChange, defaultName }: { open: boolean; onOpenChange: (o: boolean) => void; defaultName: string }) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [desc, setDesc] = useState("");
  useEffect(() => { if (open) { setName(defaultName); setDesc(""); } }, [open, defaultName]);
  const trimmed = name.trim();
  const dup = QUOTE_TEMPLATES.some((t) => t.name.trim().toLowerCase() === trimmed.toLowerCase());
  const err = !trimmed ? "Enter a template title" : dup ? "A template with this name already exists" : null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as template</DialogTitle>
          <DialogDescription>Saves the reusable setup (lane, commodity, services) — not the status, send history, or deal state. The History record is unchanged.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="h-tpl-name"><span>Template title<RequiredMark /></span></Label>
            <Input id="h-tpl-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!err} aria-describedby={err ? "h-tpl-err" : undefined} />
            {err && <p id="h-tpl-err" role="alert" className="text-xs font-medium text-destructive">{err}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="h-tpl-desc">Description <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Textarea id="h-tpl-desc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="When to use this template…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!!err} onClick={() => {
            onOpenChange(false);
            toast.success("Template saved", { description: `“${trimmed}” is ready to reuse from Templates.`, action: { label: "View template", onClick: () => router.push("/templates") } });
          }}>
            <LayoutTemplate className="size-4" /> Save template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResendDialog({ q, open, onOpenChange }: { q: QuoteHistoryItem; open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resend quote {q.id}?</DialogTitle>
          <DialogDescription>Resends the exact current quote without changing its content.</DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border">
          <DetailRow label="Recipient" value={q.customer} />
          <DetailRow label="Delivery channel" value="Front (email)" />
          <DetailRow label="Revision" value="Revision 1" />
          <DetailRow label="Client total" value={money(q.total)} last />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="gap-1.5" onClick={() => {
            onOpenChange(false);
            toast.success("Sent via Front", { description: `${q.id} re-sent to ${q.customer}.` });
          }}>
            <Send className="size-4" /> Resend quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuoteDetailsSheet({ quote: q, onClose }: { quote: QuoteHistoryItem | null; onClose: () => void }) {
  const [resendOpen, setResendOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [expiredDismissed, setExpiredDismissed] = useState(false);
  useEffect(() => { setExpiredDismissed(false); }, [q?.id]);

  return (
    <Sheet open={!!q} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg">
        {q && (
          <>
            <SheetHeader>
              <SheetTitle className="flex flex-wrap items-center gap-2">
                <span className="font-mono">{q.id}</span>
                <QuoteStatusChip status={q.status} />
                <TypeBadge type={q.quoteType} />
              </SheetTitle>
              <SheetDescription>{q.customer}</SheetDescription>
            </SheetHeader>

            <div className="space-y-5 p-4">
              {q.status === "expired" && !expiredDismissed && (
                <Alert>
                  <AlertTriangle className="size-4" />
                  <AlertTitle>This rate has expired</AlertTitle>
                  <AlertDescription>
                    The original quote is preserved, but you may need to find an updated rate before resending.
                    <span className="mt-2 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setExpiredDismissed(true)}>Keep current quote</Button>
                      <Button asChild size="sm"><Link href={duplicateHref(q)}>Find updated rates</Link></Button>
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {/* overview */}
              <section className="space-y-1.5">
                <h3 className="text-sm font-semibold">Quote overview</h3>
                <div className="rounded-lg border">
                  <DetailRow label="Quote reference" value={<span className="font-mono">{q.id}</span>} />
                  <DetailRow label="Status" value={STATUS_LABEL[q.status]} />
                  <DetailRow label="Quote type" value={TYPE_LABEL[q.quoteType]} />
                  <DetailRow label="Customer" value={q.customer} />
                  <DetailRow label="Created" value={fmtDate(q.createdAt)} />
                  <DetailRow label="Last updated" value={fmtDate(q.updatedAt)} />
                  {q.sentAt && <DetailRow label="Last sent" value={fmtDate(q.sentAt)} />}
                  <DetailRow label="Current revision" value="Revision 1" last />
                </div>
              </section>

              {/* shipment */}
              <section className="space-y-1.5">
                <h3 className="text-sm font-semibold">Shipping details</h3>
                <div className="rounded-lg border">
                  <DetailRow label="Origin" value={q.origin} />
                  <DetailRow label="Destination" value={q.destination} />
                  <DetailRow label="Commodity" value={q.commodity} />
                  <DetailRow label="Shipping type" value={q.shipmentType} last />
                </div>
              </section>

              {/* client quote */}
              <section className="space-y-1.5">
                <h3 className="text-sm font-semibold">Client quote</h3>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{q.origin.split(",")[0]} → {q.destination.split(",")[0]} · {q.commodity}</span>
                  </div>
                  <div className="mt-2 flex items-end justify-between border-t pt-2">
                    <span className="text-sm font-medium">Client total</span>
                    <span className="text-2xl font-bold tabular-nums text-primary">{money(q.total)}</span>
                  </div>
                </div>
              </section>

              {/* internal summary */}
              <section className="space-y-1.5">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                  <EyeOff className="size-4 text-muted-foreground" /> Internal summary
                  <span className="text-xs font-normal text-muted-foreground">— not visible to the client</span>
                </h3>
                <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                  Internal cost, profit, selected rate, carrier, and contract details are not persisted for historical
                  quotes in this prototype — only the client-facing summary above is stored. Reopening the quote
                  re-derives rates from the saved lane and commodity.
                </p>
              </section>

              {/* revision & send history (limited by the data model) */}
              <section className="space-y-1.5">
                <h3 className="text-sm font-semibold">Revision & send history</h3>
                <div className="rounded-lg border">
                  <DetailRow label={fmtDate(q.createdAt)} value="Created · Revision 1" />
                  {q.sentAt && <DetailRow label={fmtDate(q.sentAt)} value={`Sent via Front · ${q.customer}`} />}
                  <DetailRow label={fmtDate(q.updatedAt)} value="Last updated" last />
                </div>
                <p className="text-caption text-muted-foreground">
                  Full revision snapshots are not stored in this prototype. “Edit & resend” starts a new draft from the
                  saved lane and commodity — this record stays unchanged.
                </p>
              </section>

              {/* related deal */}
              <section className="space-y-1.5">
                <h3 className="text-sm font-semibold">Related deal</h3>
                {q.dealId ? (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="text-sm">
                      <div className="font-medium">Kommo deal <span className="font-mono text-xs">{q.dealId}</span></div>
                      <div className="text-xs text-muted-foreground">Linked to this quote</div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="gap-1.5">
                      <Link href={`/deals/${q.dealId}`}><Briefcase className="size-4" /> Open deal</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border border-dashed p-3">
                    <span className="text-sm text-muted-foreground">No deal linked to this quote.</span>
                    {(q.status === "sent" || q.status === "draft") && (
                      <CreateDealDialog trigger={<Button variant="outline" size="sm" className="gap-1.5"><Briefcase className="size-4" /> Create deal</Button>} />
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* actions */}
            <div className="mt-auto space-y-2 border-t p-4">
              {q.status === "draft" ? (
                <Button asChild className="w-full gap-1.5">
                  <Link href={reopenHref(q)}><Pencil className="size-4" /> Continue editing</Link>
                </Button>
              ) : q.status === "sent" ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button className="gap-1.5" onClick={() => setResendOpen(true)}><Send className="size-4" /> Resend</Button>
                  <Button asChild variant="outline" className="gap-1.5">
                    <Link href={reopenHref(q)}><Pencil className="size-4" /> Edit & resend</Link>
                  </Button>
                </div>
              ) : q.dealId ? (
                <Button asChild className="w-full gap-1.5">
                  <Link href={`/deals/${q.dealId}`}><Briefcase className="size-4" /> Open deal</Link>
                </Button>
              ) : (
                <Button asChild className="w-full gap-1.5">
                  <Link href={duplicateHref(q)}><Copy className="size-4" /> Duplicate quote</Link>
                </Button>
              )}
              <div className="flex gap-2">
                <Button asChild variant="ghost" size="sm" className="flex-1 gap-1.5">
                  <Link href={duplicateHref(q)}><Copy className="size-4" /> Duplicate</Link>
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 gap-1.5" onClick={() => setTplOpen(true)}>
                  <LayoutTemplate className="size-4" /> Save as template
                </Button>
              </div>
            </div>

            <ResendDialog q={q} open={resendOpen} onOpenChange={setResendOpen} />
            <SaveTemplateDialog open={tplOpen} onOpenChange={setTplOpen} defaultName={`${q.commodity} · ${q.origin.split(",")[0]} → ${q.destination.split(",")[0]}`} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── calculation details drawer ───────────────────────────────────────────────
function CalcDetailsSheet({ calc: c, onClose, onOpenQuote }: { calc: CalcHistoryItem | null; onClose: () => void; onOpenQuote: (q: QuoteHistoryItem) => void }) {
  const { user } = useSession();
  const [tplOpen, setTplOpen] = useState(false);
  // ownership gate: never surface a related quote the manager doesn't own
  const relatedRaw = getQuoteHistoryItem(c?.relatedQuoteId);
  const related = relatedRaw && relatedRaw.managerId === user?.id ? relatedRaw : undefined;
  const copy = () => { if (c) { navigator.clipboard?.writeText(`${c.calculator}: ${c.summary} → ${calcResult(c)}`); toast.success("Result copied"); } };

  return (
    <Sheet open={!!c} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        {c && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2"><Calculator className="size-4 text-primary" /> {c.calculator}</SheetTitle>
              <SheetDescription>Completed {fmtDate(c.createdAt)} · <span className="font-mono">{c.id}</span></SheetDescription>
            </SheetHeader>

            <div className="space-y-5 p-4">
              {/* saved result — distinct from recalculating */}
              <section className="space-y-1.5">
                <h3 className="text-sm font-semibold">Saved result</h3>
                <div className="rounded-lg border p-3">
                  <div className="text-2xl font-bold tabular-nums">{calcResult(c)}</div>
                  {c.unit && !/teu|slot/i.test(c.unit) && <div className="text-caption text-muted-foreground">{c.unit}</div>}
                </div>
              </section>

              <section className="space-y-1.5">
                <h3 className="text-sm font-semibold">Saved inputs</h3>
                <div className="rounded-lg border p-3 text-sm text-muted-foreground">{c.summary}</div>
                <p className="text-caption text-muted-foreground">
                  Only this input summary is persisted in the prototype — full input values are not stored, so
                  recalculating opens the calculator fresh rather than prefilled.
                </p>
              </section>

              {related && (
                <section className="space-y-1.5">
                  <h3 className="text-sm font-semibold">Related quote</h3>
                  <button type="button" onClick={() => onOpenQuote(related)} className="flex w-full items-center justify-between rounded-lg border p-3 text-left outline-none transition hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50">
                    <span className="min-w-0">
                      <span className="block font-mono text-xs font-medium text-primary">{related.id}</span>
                      <span className="block truncate text-xs text-muted-foreground">{related.customer} · {related.origin.split(",")[0]} → {related.destination.split(",")[0]}</span>
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </section>
              )}
            </div>

            <div className="mt-auto space-y-2 border-t p-4">
              <Button asChild className="w-full gap-1.5">
                <Link href={calculatorHref(c)}><RotateCcw className="size-4" /> Recalculate with current values</Link>
              </Button>
              <p className="text-center text-caption text-muted-foreground">Opens the calculator — this saved result stays unchanged.</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1 gap-1.5" onClick={copy}><Copy className="size-4" /> Copy result</Button>
                <Button variant="ghost" size="sm" className="flex-1 gap-1.5" onClick={() => setTplOpen(true)}><LayoutTemplate className="size-4" /> Save as template</Button>
              </div>
            </div>

            <SaveTemplateDialog open={tplOpen} onOpenChange={setTplOpen} defaultName={`${c.calculator} setup`} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={null}>
      <HistoryContent />
    </Suspense>
  );
}
