"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/* ============================================================================
   A ranking, shown as one.

   The reports' three league tables were ordered lists that never said they
   were ranked — position alone carried it, which reads as "some vendors" to
   anyone who does not already know the list is sorted. Each row now states its
   place.

   The number is quiet: tabular, muted, in a fixed-width gutter so the names
   stay left-aligned down the column. It marks the rank without competing with
   the vendor it belongs to, and the top three get slightly more weight because
   that is the part anyone actually reads.
   ========================================================================= */

export interface RankedRow {
  id: string;
  /** The subject of the ranking — usually a vendor. */
  label: string;
  /** The figure the ranking is by. */
  metric: React.ReactNode;
  /** One short qualifier, where it changes how the metric is read. */
  note?: string;
}

export function RankedList({
  title,
  description,
  rows,
  emptyLabel = "Nothing to rank yet.",
  className,
}: {
  title: string;
  description?: string;
  rows: RankedRow[];
  emptyLabel?: string;
  className?: string;
}) {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <Card asChild className={cn("h-full gap-3 p-4", className)}>
      <section aria-labelledby={id}>
        <div className="flex flex-col gap-0.5">
          <h3 id={id} className="text-h4 text-foreground">{title}</h3>
          {description && <p className="text-caption text-muted-foreground">{description}</p>}
        </div>

        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-caption text-muted-foreground">
            {emptyLabel}
          </p>
        ) : (
          <ol className="flex flex-col">
            {rows.map((r, i) => (
              <li
                key={r.id}
                className="flex items-baseline gap-3 border-b border-[var(--c-table-border)] py-2 last:border-b-0"
              >
                <span
                  className={cn(
                    "w-5 shrink-0 text-right text-caption tabular-nums",
                    i < 3 ? "font-bold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-body text-foreground" title={r.label}>
                  {r.label}
                  {r.note && (
                    <span className="ml-1.5 text-caption text-muted-foreground">{r.note}</span>
                  )}
                </span>
                <span className="shrink-0 text-body font-bold tabular-nums text-foreground">
                  {r.metric}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </Card>
  );
}
