"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DealStageBadge } from "@/components/status-badge";
import { ManagerAvatar } from "@/components/deals/manager-avatar";
import { getCustomer, getUser, DEAL_STAGES } from "@/lib/data";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Deal, DealStage } from "@/lib/types";

/* ============================================================================
   Pipeline board — cards are dragged between stages.

   The move is held in component state, NOT written anywhere. There is no
   backend in this prototype and the page says the pipeline is synced with
   Kommo, so a silent move would imply a sync that does not happen: the toast
   says plainly that the change is local to the session. Reloading restores the
   stored stage, which is the honest behaviour for data we cannot persist.

   Dragging is HTML5 drag-and-drop, which is pointer-only by design. A pointer
   gesture cannot be the only way to move a card, so every card is focusable
   and Ctrl/Cmd + ← → moves it one stage, with the result announced. Touch
   drag is NOT implemented — on a touch device a card taps through to its
   deal, and the keyboard path remains available with a hardware keyboard.
   ========================================================================= */

function DealCard({
  deal,
  stage,
  dragging,
  onDragStart,
  onDragEnd,
  onMoveKey,
}: {
  deal: Deal;
  stage: DealStage;
  dragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onMoveKey: (dir: -1 | 1) => void;
}) {
  const customer = getCustomer(deal.customerId);
  const manager = getUser(deal.managerId);
  const stageIndex = DEAL_STAGES.indexOf(stage);

  return (
    <article
      draggable
      tabIndex={0}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onKeyDown={(e) => {
        if (!(e.ctrlKey || e.metaKey)) return;
        if (e.key === "ArrowLeft") { e.preventDefault(); onMoveKey(-1); }
        if (e.key === "ArrowRight") { e.preventDefault(); onMoveKey(1); }
      }}
      data-deal-id={deal.id}
      aria-label={`${deal.title}. Stage ${stageIndex + 1} of ${DEAL_STAGES.length}, ${stage}. Press Control or Command with the left and right arrow keys to move it between stages.`}
      className={cn(
        "cursor-grab rounded-lg border bg-card p-3 shadow-xs transition",
        "hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "active:cursor-grabbing",
        dragging && "opacity-40",
      )}
    >
      <p className="truncate font-mono text-xs font-medium" title={deal.title}>
        {deal.title}
      </p>
      <p className="mt-1.5 truncate text-sm font-medium">{customer?.company ?? "—"}</p>
      <p className="text-xs text-muted-foreground">{deal.commodityType}</p>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <ManagerAvatar user={manager} />
          {deal.sale != null && (
            <span className="truncate text-sm font-semibold tabular-nums">{money(deal.sale)}</span>
          )}
        </div>
        {/* The card is no longer itself a link — it is a drag handle — so the
            way into the deal is an explicit control rather than the whole
            surface. draggable={false} keeps a drag that starts on the link
            from dragging the URL instead of the card. */}
        <Button asChild variant="ghost" size="sm" className="-mr-1.5 shrink-0 px-2">
          <Link href={`/deals/${deal.id}`} draggable={false} aria-label={`View details for ${deal.title}`}>
            View details
          </Link>
        </Button>
      </div>
    </article>
  );
}

export function DealBoard({ deals }: { deals: Deal[] }) {
  /* Stage moves made in this session. Keyed by deal id and layered over the
     stored stage, so the source data is never mutated. */
  const [moved, setMoved] = useState<Record<string, DealStage>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<DealStage | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const dragCounters = useRef<Record<string, number>>({});
  /* A card moved by keyboard unmounts from one column and remounts in another,
     which drops focus and strands the keyboard user mid-move. Put it back on
     the card in its new home so the next arrow press continues the sequence. */
  const refocusId = useRef<string | null>(null);
  useEffect(() => {
    const id = refocusId.current;
    if (!id) return;
    refocusId.current = null;
    document.querySelector<HTMLElement>(`[data-deal-id="${CSS.escape(id)}"]`)?.focus();
  });

  const stageOf = (d: Deal): DealStage => moved[d.id] ?? d.stage;

  const columns = useMemo(() => {
    const map = new Map<DealStage, Deal[]>(DEAL_STAGES.map((s) => [s, []]));
    for (const d of deals) map.get(stageOf(d))?.push(d);
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals, moved]);

  function moveTo(id: string, to: DealStage) {
    const deal = deals.find((d) => d.id === id);
    if (!deal || stageOf(deal) === to) return;
    setMoved((m) => ({ ...m, [id]: to }));
    setAnnouncement(`${deal.title} moved to ${to}.`);
    toast.success(`Moved to ${to}`, {
      description: "Local to this session — writing the stage back to Kommo isn’t wired up in this prototype.",
    });
  }

  function moveByKeyboard(deal: Deal, dir: -1 | 1) {
    const next = DEAL_STAGES[DEAL_STAGES.indexOf(stageOf(deal)) + dir];
    if (!next) return;
    refocusId.current = deal.id;
    moveTo(deal.id, next);
  }

  return (
    <>
      {/* Bleeds to the edges of the content surface so a column that runs off
          the side is cut by the container itself rather than stopping short of
          it; the inner padding keeps the first column aligned with the page. */}
      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
        <div className="flex min-w-max gap-3">
          {DEAL_STAGES.map((stage) => {
            const col = columns.get(stage) ?? [];
            const colTotal = col.reduce((s, d) => s + (d.sale ?? 0), 0);
            const isTarget = overStage === stage && dragId !== null;

            return (
              <div
                key={stage}
                className="flex w-72 flex-shrink-0 flex-col"
                onDragEnter={(e) => {
                  e.preventDefault();
                  dragCounters.current[stage] = (dragCounters.current[stage] ?? 0) + 1;
                  setOverStage(stage);
                }}
                onDragOver={(e) => {
                  // Without preventDefault the browser refuses the drop.
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDragLeave={() => {
                  // Counted, because dragleave also fires when the pointer
                  // crosses onto a CHILD of the column.
                  dragCounters.current[stage] = (dragCounters.current[stage] ?? 1) - 1;
                  if (dragCounters.current[stage] <= 0) {
                    setOverStage((s) => (s === stage ? null : s));
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  dragCounters.current[stage] = 0;
                  const id = e.dataTransfer.getData("text/plain") || dragId;
                  if (id) moveTo(id, stage);
                  setDragId(null);
                  setOverStage(null);
                }}
              >
                <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
                  <div className="flex items-center gap-2">
                    <DealStageBadge stage={stage} />
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {col.length}
                    </span>
                  </div>
                  <span className="text-body font-bold tabular-nums text-foreground">
                    {money(colTotal)}
                  </span>
                </div>

                <Card
                  className={cn(
                    "flex-1 gap-2 bg-muted/40 p-2 transition-colors",
                    col.length === 0 && "min-h-24",
                    isTarget && "border-primary bg-primary-subtle ring-2 ring-primary/30",
                  )}
                >
                  {col.length === 0 ? (
                    <p className="grid h-full place-items-center py-6 text-xs text-muted-foreground">
                      {isTarget ? "Drop here" : "No deals"}
                    </p>
                  ) : (
                    col.map((d) => (
                      <DealCard
                        key={d.id}
                        deal={d}
                        stage={stage}
                        dragging={dragId === d.id}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", d.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDragId(d.id);
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          setOverStage(null);
                          dragCounters.current = {};
                        }}
                        onMoveKey={(dir) => moveByKeyboard(d, dir)}
                      />
                    ))
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drag gives no feedback a screen reader can use; this does. */}
      <p aria-live="polite" className="sr-only">{announcement}</p>
    </>
  );
}
