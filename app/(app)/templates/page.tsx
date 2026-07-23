"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, Plus, ChevronDown, Search as SearchIcon, MoreVertical, Wand2, Pencil,
  TextCursorInput, Copy, Trash2, ListChecks, Route as RouteIcon, Calculator, LayoutTemplate, FileText,
} from "lucide-react";
import { toast } from "sonner";

import { QUOTE_TEMPLATES, TEMPLATE_TYPE_LABEL, getPort, getAddress, getEquipment } from "@/lib/data";
import type { QuoteTemplate, TemplateType } from "@/lib/data/templates";
import { encodeSearch } from "@/lib/search-params";
import { relativeAge } from "@/lib/format";
import { COMMODITY_KIND_LABEL } from "@/components/commodity-picker";
import type { CommodityKind } from "@/lib/types";
import { cn } from "@/lib/utils";

import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// ── helpers ──────────────────────────────────────────────────────────────────
const TYPE_ICON: Record<TemplateType, typeof ListChecks> = {
  "rate-quote": ListChecks, "custom-route": RouteIcon, calculation: Calculator,
};
const TYPE_TONE: Record<TemplateType, "status-info" | "status-positive" | "secondary"> = {
  "rate-quote": "status-info", "custom-route": "status-positive", calculation: "secondary",
};

const loadingMethod = (t: QuoteTemplate) => (t.shipmentType === "Flatrack" ? "Flat Rack" : t.shipmentType);
const locName = (portId?: string, addrId?: string) => getPort(portId)?.name ?? getAddress(addrId)?.city ?? "—";
const itemName = (t: QuoteTemplate) => {
  const eq = getEquipment(t.equipmentId);
  return eq ? `${eq.make} ${eq.model}` : t.commodityLabel || undefined;
};

// Prefill the Rate Quote flow from a template (a new draft — the template is untouched).
function templateHref(t: QuoteTemplate): string {
  return `/quote-master?${encodeSearch({
    originPortId: t.originPortId, originAddressId: t.originAddressId,
    destPortId: t.destPortId, destAddressId: t.destAddressId,
    equipmentId: t.equipmentId, commodityKind: t.commodityKind, commodityLabel: t.commodityLabel,
    shipmentType: t.shipmentType, container: t.container, advancedSearch: false,
  })}`;
}

function searchBlob(t: QuoteTemplate): string {
  return [
    t.name, t.description, locName(t.originPortId, t.originAddressId), locName(t.destPortId, t.destAddressId),
    COMMODITY_KIND_LABEL[t.commodityKind], t.commodityLabel, itemName(t), ...t.services,
  ].filter(Boolean).join(" ").toLowerCase();
}

type Tab = "all" | "rate-quote" | "custom-route";
type SortKey = "recent" | "name" | "used";
const SORTS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Recently used" },
  { value: "name", label: "Name: A–Z" },
  { value: "used", label: "Most used" },
];
const SORT_FNS: Record<SortKey, (a: QuoteTemplate, b: QuoteTemplate) => number> = {
  recent: (a, b) => b.lastUsed.localeCompare(a.lastUsed),
  name: (a, b) => a.name.localeCompare(b.name),
  used: (a, b) => b.usageCount - a.usageCount,
};

// ── page ─────────────────────────────────────────────────────────────────────
export default function TemplatesPage() {
  const router = useRouter();
  // In-memory list seeded from the saved templates. Rename/duplicate/delete act on
  // this copy — persisting them back needs backend support that isn't present.
  const [templates, setTemplates] = useState<QuoteTemplate[]>(() => QUOTE_TEMPLATES.map((t) => ({ ...t })));
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [commodity, setCommodity] = useState<"all" | CommodityKind>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const [renameTarget, setRenameTarget] = useState<QuoteTemplate | null>(null);
  const [dupTarget, setDupTarget] = useState<QuoteTemplate | null>(null);
  const [delTarget, setDelTarget] = useState<QuoteTemplate | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<QuoteTemplate | null>(null);
  const dupSeq = useRef(0); // monotonic — unique copy ids even after deletes

  const counts = useMemo(() => ({
    all: templates.length,
    "rate-quote": templates.filter((t) => t.type === "rate-quote").length,
    "custom-route": templates.filter((t) => t.type === "custom-route").length,
  }), [templates]);

  const commodityKinds = useMemo(
    () => Array.from(new Set(templates.map((t) => t.commodityKind))),
    [templates],
  );

  const filtered = useMemo(() => {
    let out = templates;
    if (tab !== "all") out = out.filter((t) => t.type === tab);
    if (commodity !== "all") out = out.filter((t) => t.commodityKind === commodity);
    const query = q.trim().toLowerCase();
    if (query) out = out.filter((t) => searchBlob(t).includes(query));
    return [...out].sort(SORT_FNS[sort]);
  }, [templates, tab, commodity, q, sort]);

  const filtersActive = q.trim() !== "" || commodity !== "all";
  const clearFilters = () => { setQ(""); setCommodity("all"); };

  const nameExists = (name: string, exceptId?: string) =>
    templates.some((t) => t.id !== exceptId && t.name.trim().toLowerCase() === name.trim().toLowerCase());

  const doRename = (id: string, name: string) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, name: name.trim() } : t)));
    toast.success("Template renamed");
  };
  const doDuplicate = (orig: QuoteTemplate, name: string) => {
    const copy: QuoteTemplate = { ...orig, id: `${orig.id}-copy-${++dupSeq.current}`, name: name.trim(), usageCount: 0 };
    setTemplates((prev) => [copy, ...prev]);
    toast.success("Template duplicated");
  };
  const doDelete = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.success("Template deleted");
  };

  const useTemplate = (t: QuoteTemplate) => router.push(templateHref(t));
  const editTemplate = (t: QuoteTemplate) => router.push(templateHref(t)); // opens the workflow with the saved data

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Templates"
        description="Reuse saved quote, route, and calculation setups to work faster."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-1.5"><Plus className="size-4" /> Create template <ChevronDown className="size-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => router.push("/quote-master")}>
              <ListChecks className="size-4" /> Rate Quote template
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/route-builder")}>
              <RouteIcon className="size-4" /> Custom Route template
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <div className="-mx-1 overflow-x-auto px-1">
          <TabsList>
            <TabsTrigger value="all">All <TabCount n={counts.all} /></TabsTrigger>
            <TabsTrigger value="rate-quote">Rate Quotes <TabCount n={counts["rate-quote"]} /></TabsTrigger>
            <TabsTrigger value="custom-route">Custom Routes <TabCount n={counts["custom-route"]} /></TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Search + filter + sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates" className="pl-8" aria-label="Search templates" />
        </div>
        <div className="flex items-center gap-2">
          <Select value={commodity} onValueChange={(v) => setCommodity(v as "all" | CommodityKind)}>
            <SelectTrigger size="sm" className="w-44" aria-label="Filter by commodity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All commodities</SelectItem>
              {commodityKinds.map((k) => <SelectItem key={k} value={k}>{COMMODITY_KIND_LABEL[k]}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5">
            <Label htmlFor="tpl-sort" className="hidden text-xs text-muted-foreground sm:inline">Sort</Label>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger id="tpl-sort" size="sm" className="w-40" aria-label="Sort templates"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* announce result changes to assistive tech */}
      <p className="sr-only" role="status" aria-live="polite">{filtered.length} {filtered.length === 1 ? "template" : "templates"} shown</p>

      {/* Grid / empty states */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <TemplateCard
              key={t.id}
              t={t}
              onUse={() => useTemplate(t)}
              onEdit={() => editTemplate(t)}
              onRename={() => setRenameTarget(t)}
              onDuplicate={() => setDupTarget(t)}
              onDelete={() => setDelTarget(t)}
              onDetails={() => setDetailsTarget(t)}
            />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          title="No templates yet"
          description="Save a Rate Quote, Custom Route, or calculation as a template to reuse it later."
          actions={
            <>
              <Button asChild><Link href="/quote-master">Create rate quote</Link></Button>
              <Button asChild variant="outline"><Link href="/route-builder">Build custom route</Link></Button>
              <Button asChild variant="outline"><Link href="/calculators">Open calculators</Link></Button>
            </>
          }
        />
      ) : filtersActive ? (
        <EmptyState
          title="No templates found"
          description="Try another search or clear the filters."
          actions={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
        />
      ) : tab === "custom-route" ? (
        <EmptyState
          title="No Custom Route templates"
          description="Save a custom route to quickly reuse its stages, vendors, and settings."
          actions={<Button asChild variant="outline"><Link href="/route-builder">Build custom route</Link></Button>}
        />
      ) : (
        <EmptyState
          title="No Rate Quote templates"
          description="Save a rate quote to reuse its lane, commodity, and services."
          actions={<Button asChild variant="outline"><Link href="/quote-master">Create rate quote</Link></Button>}
        />
      )}

      <RenameDialog target={renameTarget} onClose={() => setRenameTarget(null)} nameExists={nameExists} onSave={doRename} />
      <DuplicateDialog target={dupTarget} onClose={() => setDupTarget(null)} nameExists={nameExists} onSave={doDuplicate} />
      <DeleteDialog target={delTarget} onClose={() => setDelTarget(null)} onConfirm={doDelete} />
      <DetailsSheet target={detailsTarget} onClose={() => setDetailsTarget(null)} onUse={useTemplate} />
    </div>
  );
}

function TabCount({ n }: { n: number }) {
  return <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">{n}</span>;
}

// ── card ─────────────────────────────────────────────────────────────────────
function TemplateCard({
  t, onUse, onEdit, onRename, onDuplicate, onDelete, onDetails,
}: {
  t: QuoteTemplate;
  onUse: () => void; onEdit: () => void; onRename: () => void; onDuplicate: () => void; onDelete: () => void; onDetails: () => void;
}) {
  const TypeIcon = TYPE_ICON[t.type];
  const origin = locName(t.originPortId, t.originAddressId);
  const dest = locName(t.destPortId, t.destAddressId);
  const item = itemName(t);
  const services = t.services.slice(0, 4);
  const extra = t.services.length - services.length;

  return (
    <Card className="flex h-full flex-col gap-0 overflow-hidden p-0">
      <div className="space-y-2 p-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={TYPE_TONE[t.type]} className="gap-1"><TypeIcon className="size-3" /> {TEMPLATE_TYPE_LABEL[t.type]}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" aria-label={`More actions for ${t.name}`}><MoreVertical className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onEdit}><Pencil className="size-4" /> Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={onRename}><TextCursorInput className="size-4" /> Rename</DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}><Copy className="size-4" /> Duplicate</DropdownMenuItem>
              <DropdownMenuItem onClick={onDetails}><FileText className="size-4" /> View details</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}><Trash2 className="size-4" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <button type="button" onClick={onDetails} className="block w-full rounded text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <h3 className="truncate font-semibold leading-snug" title={t.name}>{t.name}</h3>
        </button>
        <Tooltip>
          <TooltipTrigger asChild>
            <p tabIndex={0} className="line-clamp-2 rounded text-sm text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">{t.description}</p>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">{t.description}</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 space-y-2.5 px-4 pb-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="min-w-0 truncate">{origin}</span>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 truncate">{dest}</span>
        </div>
        <dl className="space-y-1 text-xs">
          <Row label="Commodity" value={COMMODITY_KIND_LABEL[t.commodityKind]} />
          {item && <Row label="Item" value={item} />}
          <Row label="Loading" value={`${loadingMethod(t)}${t.container ? ` · ${t.container}` : ""}`} />
        </dl>
        {services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {services.map((s) => (
              <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{s}</span>
            ))}
            {extra > 0 && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">+{extra} more</span>}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t p-3">
        <div className="min-w-0 text-xs text-muted-foreground">
          <div className="tabular-nums text-foreground">Used {t.usageCount} times</div>
          <div>Last used {relativeAge(t.lastUsed)}</div>
        </div>
        <Button size="sm" className="shrink-0 gap-1.5" onClick={onUse}><Wand2 className="size-4" /> Use template</Button>
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate font-medium text-foreground" title={value}>{value}</dd>
    </div>
  );
}

// ── dialogs ──────────────────────────────────────────────────────────────────
function RenameDialog({ target, onClose, nameExists, onSave }: {
  target: QuoteTemplate | null; onClose: () => void; nameExists: (n: string, exceptId?: string) => boolean; onSave: (id: string, name: string) => void;
}) {
  const [name, setName] = useState("");
  useEffect(() => { if (target) setName(target.name); }, [target]);
  const open = !!target;
  const trimmed = name.trim();
  const err = !trimmed ? "Enter a template title" : nameExists(name, target?.id) ? "A template with this name already exists" : null;
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Rename template</DialogTitle></DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="rename-input">Template title</Label>
          <Input id="rename-input" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!err} aria-describedby={err ? "rename-err" : undefined} autoFocus />
          {err && <p id="rename-err" role="alert" className="text-xs font-medium text-destructive">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!!err} onClick={() => { if (target && !err) { onSave(target.id, name); onClose(); } }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DuplicateDialog({ target, onClose, nameExists, onSave }: {
  target: QuoteTemplate | null; onClose: () => void; nameExists: (n: string) => boolean; onSave: (orig: QuoteTemplate, name: string) => void;
}) {
  const [name, setName] = useState("");
  useEffect(() => { if (target) setName(`Copy of ${target.name}`); }, [target]);
  const open = !!target;
  const trimmed = name.trim();
  const err = !trimmed ? "Enter a template title" : nameExists(name) ? "A template with this name already exists" : null;
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Duplicate template</DialogTitle>
          <DialogDescription>Creates a separate copy you can edit independently.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="dup-input">New template title</Label>
          <Input id="dup-input" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!err} aria-describedby={err ? "dup-err" : undefined} autoFocus />
          {err && <p id="dup-err" role="alert" className="text-xs font-medium text-destructive">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!!err} onClick={() => { if (target && !err) { onSave(target, name); onClose(); } }}>Duplicate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({ target, onClose, onConfirm }: { target: QuoteTemplate | null; onClose: () => void; onConfirm: (id: string) => void }) {
  return (
    <AlertDialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete template?</AlertDialogTitle>
          <AlertDialogDescription>
            This template will be permanently removed. Existing quotes or calculations created from it will not be affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => { if (target) { onConfirm(target.id); onClose(); } }} className="bg-destructive text-white hover:bg-destructive/90">
            Delete template
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DetailsSheet({ target, onClose, onUse }: { target: QuoteTemplate | null; onClose: () => void; onUse: (t: QuoteTemplate) => void }) {
  const t = target;
  return (
    <Sheet open={!!t} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        {t && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2"><LayoutTemplate className="size-4 text-primary" /> {t.name}</SheetTitle>
              <SheetDescription>{TEMPLATE_TYPE_LABEL[t.type]} template</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 p-4 text-sm">
              <p className="text-muted-foreground">{t.description}</p>
              <div className="rounded-lg border">
                <DetailRow label="Origin" value={locName(t.originPortId, t.originAddressId)} />
                <DetailRow label="Destination" value={locName(t.destPortId, t.destAddressId)} />
                <DetailRow label="Commodity" value={COMMODITY_KIND_LABEL[t.commodityKind]} />
                {itemName(t) && <DetailRow label="Item" value={itemName(t)!} />}
                <DetailRow label="Loading method" value={loadingMethod(t)} />
                {t.container && <DetailRow label="Container" value={t.container} />}
                <DetailRow label="Services" value={t.services.join(", ") || "—"} />
                <DetailRow label="Last used" value={relativeAge(t.lastUsed)} />
                <DetailRow label="Times used" value={String(t.usageCount)} last />
              </div>
              <p className="text-caption text-muted-foreground">Using a template starts a new draft — the template itself is not changed.</p>
            </div>
            <div className="mt-auto border-t p-4">
              <Button className="w-full gap-1.5" onClick={() => { onUse(t); onClose(); }}><Wand2 className="size-4" /> Use template</Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 px-3 py-2", !last && "border-b")}>
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium">{value}</span>
    </div>
  );
}

function EmptyState({ title, description, actions }: { title: string; description: string; actions: React.ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 p-10 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground"><LayoutTemplate className="size-6" /></div>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 pt-1">{actions}</div>
    </Card>
  );
}
