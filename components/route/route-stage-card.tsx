"use client";

import { useState, type HTMLAttributes } from "react";
import {
  GripVertical, MoreVertical, ArrowUp, ArrowDown, Trash2, Ship, ChevronDown, Layers, Info,
  ClipboardCheck, Truck, TrainFront, Wrench, Droplets, PackageOpen, Container, MapPin, Anchor, Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/status-badge";
import { CarrierLogo } from "@/components/carrier-logo";
import { ChargeTable } from "@/components/quote/charge-table";
import { AiSourcing, type AiState } from "@/components/route/ai-sourcing";
import { stageStatus, STAGE_STATUS_META, provenanceBadge, PROVENANCE_META } from "@/components/route/route-status";
import { money, fmtDate } from "@/lib/format";
import { chargeTotal } from "@/lib/quote-engine";
import { cn } from "@/lib/utils";
import { CARRIERS, getCarrier } from "@/lib/data/carriers";
import { getVendor, DATA_SOURCES, getDataSource } from "@/lib/data/vendors";
import type { RouteStep, ChargeLine, Vendor } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  ClipboardCheck, Truck, TrainFront, Wrench, Droplets, PackageOpen, Container, Ship, MapPin, Anchor, Sparkles, Package: PackageOpen,
};
const iconFor = (name: string): LucideIcon => ICONS[name] ?? Anchor;

const sumCharges = (charges?: ChargeLine[]) => (charges ?? []).reduce((s, c) => s + chargeTotal(c), 0);

/** Map a chosen rate source to a firm provenance so the badge is accurate. */
function provenanceForSource(dataSourceId?: string): RouteStep["provenance"] {
  const ds = getDataSource(dataSourceId);
  if (!ds) return "manual";
  if (ds.kind === "uploaded_contract") return "contract";
  if (ds.kind === "shipping_line_api") return "api";
  return "manual";
}

function StageStatusBadge({ step, aiPhase }: { step: RouteStep; aiPhase: AiState["phase"] }) {
  const st = stageStatus(step, aiPhase);
  const meta = STAGE_STATUS_META[st];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} role="note" aria-label={`Status: ${meta.label}. ${meta.help}`} className="inline-flex rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"><StatusBadge tone={meta.tone}>{meta.label}</StatusBadge></span>
      </TooltipTrigger>
      <TooltipContent className="max-w-56">{meta.help}</TooltipContent>
    </Tooltip>
  );
}

function ProvenanceBadge({ step }: { step: RouteStep }) {
  const p = provenanceBadge(step);
  if (!p) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} role="note" aria-label={`Rate source: ${p.label}`} className="inline-flex items-center gap-1 rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <StatusBadge tone={p.tone} dot={false}>{p.ai && <Sparkles className="size-3" />}{p.label}</StatusBadge>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        {p.estimated
          ? "Estimated rate — confirm with the vendor before quoting to a client."
          : p.ai
            ? "Sourced with AI assistance. Verify before quoting."
            : "Rate set for this stage."}
      </TooltipContent>
    </Tooltip>
  );
}

function DragHandle({ title, dragHandleProps }: { title: string; dragHandleProps?: HTMLAttributes<HTMLButtonElement> & { draggable?: boolean } }) {
  return (
    <button
      type="button"
      aria-label={`Drag to reorder ${title}`}
      className="shrink-0 cursor-grab rounded text-muted-foreground/60 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing"
      {...dragHandleProps}
    >
      <GripVertical className="size-4" />
    </button>
  );
}

function StageMenu({ title, isFirst, isLast, onMoveUp, onMoveDown, onDeleteRequest }: {
  title: string; isFirst: boolean; isLast: boolean; onMoveUp: () => void; onMoveDown: () => void; onDeleteRequest: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7 shrink-0" aria-label={`More actions for ${title}`}><MoreVertical className="size-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem disabled={isFirst} onClick={onMoveUp}><ArrowUp className="size-4" /> Move up</DropdownMenuItem>
        <DropdownMenuItem disabled={isLast} onClick={onMoveDown}><ArrowDown className="size-4" /> Move down</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={(e) => { e.preventDefault(); onDeleteRequest(); }}>
          <Trash2 className="size-4" /> Delete stage
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RouteStageCard({
  step, index, total, collapsed, canCollapse, onToggleCollapse,
  vendors, onPatch, onRemove, onMoveUp, onMoveDown, onSearchOcean,
  ai, onAiChange, dragHandleProps, dragging,
}: {
  step: RouteStep;
  index: number;
  total: number;
  collapsed: boolean;
  canCollapse: boolean;
  onToggleCollapse: () => void;
  vendors: Vendor[];
  onPatch: (patch: Partial<RouteStep>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSearchOcean: () => void;
  ai: AiState;
  onAiChange: (next: AiState) => void;
  dragHandleProps?: HTMLAttributes<HTMLButtonElement> & { draggable?: boolean };
  dragging?: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const Icon = iconFor(step.icon);
  const hasCharges = !!step.charges?.length;
  const aiApplied = !!step.provenance && PROVENANCE_META[step.provenance]?.ai;
  const aiLabel = step.vendorId || step.carrierId ? "Find rate with AI" : "Find vendor and rate with AI";
  const vendorName = step.kind === "ocean" ? getCarrier(step.carrierId)?.name : getVendor(step.vendorId)?.name;

  // Manual cost edit: keep AI provenance but flag it edited; otherwise it becomes a manual rate.
  const editCost = (v: number) => {
    const patch: Partial<RouteStep> = { cost: v };
    if (aiApplied) patch.edited = true;
    else patch.provenance = "manual";
    onPatch(patch);
  };
  // Choosing a rate source sets a fresh authoritative rate — clear any prior "edited" flag.
  const editSource = (id: string) => onPatch({ dataSourceId: id, provenance: provenanceForSource(id), edited: false });

  const isFirst = index === 0;
  const isLast = index === total - 1;

  const menu = (
    <StageMenu title={step.title} isFirst={isFirst} isLast={isLast} onMoveUp={onMoveUp} onMoveDown={onMoveDown} onDeleteRequest={() => setConfirmDelete(true)} />
  );

  const deleteDialog = (
    <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this stage?</AlertDialogTitle>
          <AlertDialogDescription>
            “{step.title}” and its rate, vendor, and duration will be removed from the route. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onRemove} className="bg-destructive text-white hover:bg-destructive/90">Delete stage</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // ── collapsed (completed) summary ──
  if (collapsed) {
    return (
      <>
        <Card className={cn("flex flex-row items-center gap-2 p-3", dragging && "opacity-50 ring-2 ring-primary/40")}>
          <DragHandle title={step.title} dragHandleProps={dragHandleProps} />
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={false}
            aria-label={`Expand ${step.title}`}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold tabular-nums text-muted-foreground">{index + 1}</span>
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">{step.title}</span>
                <StageStatusBadge step={step} aiPhase={ai.phase} />
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {step.location}{step.toLocation ? ` → ${step.toLocation}` : ""}{vendorName ? ` · ${vendorName}` : ""}
              </div>
            </div>
            <div className="shrink-0 pr-1 text-right">
              <div className="text-sm font-semibold tabular-nums">{money(step.cost)}</div>
              <div className="text-caption text-muted-foreground">{step.durationDays} d</div>
            </div>
          </button>
          {menu}
        </Card>
        {deleteDialog}
      </>
    );
  }

  // ── expanded (editable) ──
  return (
    <>
    <Card className={cn("p-4", dragging && "opacity-50 ring-2 ring-primary/40")}>
      <div className="flex items-start gap-3">
        {/* rail: drag handle + number + icon */}
        <div className="flex flex-col items-center gap-2 pt-0.5">
          <button
            type="button"
            aria-label={`Drag to reorder ${step.title}`}
            className="cursor-grab rounded text-muted-foreground/60 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing"
            {...dragHandleProps}
          >
            <GripVertical className="size-4" />
          </button>
          <span className="grid size-6 place-items-center rounded-full bg-muted text-xs font-semibold tabular-nums text-muted-foreground">{index + 1}</span>
          <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></div>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          {/* header: title/type, route, status, source badge, more menu */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium">{step.title}</p>
                <StageStatusBadge step={step} aiPhase={ai.phase} />
                <ProvenanceBadge step={step} />
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {step.location}{step.toLocation ? <span className="mx-1 text-foreground/40">→</span> : null}{step.toLocation}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {step.carrierId && <CarrierLogo carrierId={step.carrierId} size="sm" />}
              {canCollapse && (
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={onToggleCollapse} aria-expanded>
                  Collapse
                </Button>
              )}
              {menu}
            </div>
          </div>

          {/* custom step name */}
          {step.kind === "custom" && (
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Stage name</Label><Input value={step.title} onChange={(e) => onPatch({ title: e.target.value })} size="sm" aria-label="Stage name" /></div>
          )}

          {/* vendor/carrier + rate source */}
          <div className="grid gap-2 sm:grid-cols-2">
            {step.kind === "ocean" ? (
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Carrier</Label>
                <Select value={step.carrierId} onValueChange={(v) => onPatch({ carrierId: v, edited: aiApplied ? true : step.edited })}>
                  <SelectTrigger size="sm" aria-label="Carrier"><SelectValue placeholder="Select carrier" /></SelectTrigger>
                  <SelectContent>{CARRIERS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Vendor</Label>
                <Select value={step.vendorId} onValueChange={(v) => onPatch({ vendorId: v, edited: aiApplied ? true : step.edited })}>
                  <SelectTrigger size="sm" aria-label="Vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>{vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name} · T{v.tier}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Rate source</Label>
              <Select value={step.dataSourceId} onValueChange={editSource}>
                <SelectTrigger size="sm" aria-label="Rate source"><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>{DATA_SOURCES.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Sourcing: ocean legs use the shipping-line search; other legs use AI vendor+rate sourcing */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed bg-muted/20 p-2.5">
            {step.kind === "ocean" ? (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onSearchOcean}><Ship className="size-4" /> Search shipping lines</Button>
            ) : (
              <AiSourcing
                step={step}
                vendors={vendors}
                baseCost={Number(step.cost) || 0}
                baseDays={Number(step.durationDays) || 0}
                label={aiLabel}
                ai={ai}
                onAiChange={onAiChange}
                onApply={onPatch}
              />
            )}
          </div>

          {/* cost + duration */}
          <div className="flex flex-wrap items-end gap-3">
            {hasCharges ? (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Internal cost (from breakdown)</Label>
                <div className="flex h-8 w-36 items-center rounded-md border bg-muted/40 px-2 text-sm font-medium tabular-nums">{money(step.cost)}</div>
              </div>
            ) : (
              <div className="space-y-1">
                <Label htmlFor={`cost-${step.id}`} className="text-xs text-muted-foreground">Internal cost (USD)</Label>
                <Input id={`cost-${step.id}`} type="number" min={0} value={step.cost} onChange={(e) => editCost(Number(e.target.value))} size="sm" className="w-36 tabular-nums" />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor={`days-${step.id}`} className="text-xs text-muted-foreground">Duration (days)</Label>
              <Input id={`days-${step.id}`} type="number" min={0} value={step.durationDays} onChange={(e) => onPatch({ durationDays: Number(e.target.value) })} size="sm" className="w-28 tabular-nums" />
            </div>
          </div>

          {/* ocean surcharge breakdown */}
          {hasCharges && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <button className="group flex w-full items-center gap-1.5 rounded-md border bg-muted/30 px-2.5 py-1.5 text-left text-xs font-medium text-muted-foreground hover:bg-muted">
                  <Layers className="size-3.5 text-primary" /> Surcharges &amp; details ({step.charges!.length} lines)
                  {(step.vessel || step.sailingDate) && (
                    <span className="ml-1 truncate font-normal">· {step.vessel}{step.sailingDate ? ` · sailing ${fmtDate(step.sailingDate)}` : ""}{step.freeDaysPod != null ? ` · ${step.freeDaysPod} free days POD` : ""}</span>
                  )}
                  <ChevronDown className="ml-auto size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                {/* Hand-editing surcharges alters the sourced cost → flag it so the stage no longer reads as a clean firm rate */}
                <ChargeTable charges={step.charges!} onChange={(charges) => onPatch({ charges, cost: sumCharges(charges), edited: true })} />
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </Card>
    {deleteDialog}
    </>
  );
}
