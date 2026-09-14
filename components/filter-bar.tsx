"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* ============================================================================
   RMS / Filter bar — one filter treatment for the whole product.

   The rule it encodes came out of the rate filters: a group title is 14px in
   the foreground with ~10px to its control. Titles were 12px muted there,
   which made the thing you were filtering BY smaller than the value you were
   filtering it to.

   It is a row, not a panel. Filters that live in their own bordered card
   become a second page region competing with the table they belong to; here
   they sit above the table as one compact band, wrapping rather than
   overflowing, and the reset appears only once something is actually set.
   ========================================================================= */

export function FilterBar({
  children,
  onReset,
  activeCount = 0,
  className,
}: {
  children: React.ReactNode;
  /** Omit and no reset is offered. */
  onReset?: () => void;
  /** How many filters are away from their default; drives the reset. */
  activeCount?: number;
  className?: string;
}) {
  return (
    <section aria-label="Filters" className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-body font-bold text-foreground">
          <SlidersHorizontal aria-hidden className="size-4 text-muted-foreground" />
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-primary-subtle px-2 py-0.5 text-caption font-medium tabular-nums text-primary">
              {activeCount}
            </span>
          )}
        </h2>
        {onReset && activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="size-4" /> Reset
          </Button>
        )}
      </div>

      {/* Wraps on narrow screens rather than scrolling sideways; each field
          carries its own min-width so a select never collapses to a sliver. */}
      <div className="flex flex-wrap items-end gap-3">{children}</div>
    </section>
  );
}

export function FilterField({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-44 flex-1 flex-col gap-1.5 sm:flex-none", className)}>
      <Label htmlFor={htmlFor} className="text-body font-medium text-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

/** A filter whose control is its own label — a switch, a toggle group. The
    label sits beside it rather than above, because the control already reads
    as a sentence with it. */
export function FilterToggleField({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-11 items-center gap-2.5 sm:min-h-0 sm:self-end sm:pb-2.5", className)}>
      {children}
      <Label htmlFor={htmlFor} className="text-body font-medium text-foreground">
        {label}
      </Label>
    </div>
  );
}
