"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ============================================================================
   RMS / Action Bar — the primary actions of a multi-step flow, held at the
   bottom of the viewport while the step scrolls.

   STICKY, NOT FIXED, and deliberately so:

     • A fixed bar leaves the flow, so every page that uses one has to
       hand-maintain bottom padding to stop it covering the last row of
       content — and gets it wrong at some viewport height or step. A sticky
       bar keeps its place in the layout, so nothing can hide underneath it
       and no page needs to know the bar exists.

     • This app's content column is inset from a sidebar of variable width
       (7rem collapsed, wider open). A fixed bar spans the viewport and would
       have to be told that width; a sticky one is already inside the column.

     • The document is the scroll container here (the shell grows; it does not
       scroll internally), so `bottom-0` pins to the viewport edge as intended.

   Mobile: actions stack full-width at the standard 44px control height, and
   the bar clears the device's bottom inset so a home indicator cannot sit on
   top of the primary action.
   ========================================================================= */

export function ActionBar({
  children,
  /** Lower-emphasis actions; sit opposite the primary group on desktop. */
  aside,
  className,
  innerClassName,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-30 mt-2",
        // the device's own bottom inset, so the bar clears a home indicator
        "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col-reverse gap-2 rounded-card border border-[var(--c-card-border)] bg-card p-3 shadow-bar",
          "sm:flex-row sm:items-center sm:justify-end",
          // Full-width, full-height targets on a phone; natural width from sm up.
          "[&_button]:w-full [&_button]:min-h-11 sm:[&_button]:w-auto sm:[&_button]:min-h-0",
          "[&_a]:w-full sm:[&_a]:w-auto",
          innerClassName,
        )}
      >
        {aside && (
          <div className="flex flex-col-reverse gap-2 sm:mr-auto sm:flex-row sm:items-center">
            {aside}
          </div>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">{children}</div>
      </div>
    </div>
  );
}
