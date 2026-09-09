import { Check, Clock } from "lucide-react";

import { cn } from "@/lib/utils";

/* ============================================================================
   RMS / Stepper — horizontal progress through a known sequence of stages.

   Built from the brand-secondary (amber) + neutral tokens only. The track runs
   a three-stop gradient across the completed portion — deep amber, through the
   brand accent, fading into the pale tint where it meets the untravelled part
   of the pill — mirroring the design reference.

   IMPORTANT: the brand accent #FFB051 is a LIGHT colour. White on it measures
   1.81:1 and fails, so glyphs sitting on an amber fill use the dark
   on-secondary token (10.29:1). Do not "fix" these to white.

   Status is never carried by colour alone: each step gets a glyph (check /
   clock / dot), the current step is marked textually with parentheses and
   aria-current, and every step carries a screen-reader status word.
   ========================================================================= */

export type StepState = "complete" | "current" | "upcoming";

export interface Step {
  label: string;
  state: StepState;
  /** Optional detail shown under the label. */
  hint?: string;
}

const SR_STATUS: Record<StepState, string> = {
  complete: "completed",
  current: "in progress",
  upcoming: "not started yet",
};

export function Stepper({
  steps,
  className,
  ariaLabel = "Progress",
}: {
  steps: Step[];
  className?: string;
  ariaLabel?: string;
}) {
  const n = steps.length;
  const cols = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` };

  // Fill the track up to the centre of the last step that is done or underway.
  const lastActive = steps.reduce(
    (acc, s, i) => (s.state === "complete" || s.state === "current" ? i : acc),
    -1,
  );
  const fill = lastActive < 0 ? 0 : ((lastActive + 0.5) / n) * 100;

  return (
    <div className={cn("w-full", className)}>
      {/* track */}
      <div className="relative overflow-hidden rounded-full bg-muted p-2.5 sm:p-3">
        <div
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-[width] duration-500",
            // deep amber → brand accent → pale tint, so the fill dissolves into
            // the untravelled track instead of stopping on a hard edge
            "bg-gradient-to-r from-brand-secondary-active via-brand-secondary to-brand-secondary-subtle",
          )}
          style={{ width: `${fill}%` }}
        />
        <ol className="relative grid" style={cols} aria-label={ariaLabel}>
          {steps.map((s, i) => (
            <li key={s.label} className="flex justify-center">
              <span
                aria-current={s.state === "current" ? "step" : undefined}
                className={cn(
                  "grid size-9 place-items-center rounded-full sm:size-11",
                  // dark glyph on the amber fill — white would be 1.81:1
                  s.state === "complete" && "bg-brand-secondary text-brand-secondary-foreground",
                  s.state === "current" &&
                    "bg-card text-brand-secondary-active ring-2 ring-brand-secondary",
                  s.state === "upcoming" && "bg-card/70 text-fg-disabled ring-1 ring-border-divider",
                )}
              >
                {s.state === "complete" ? (
                  <Check aria-hidden className="size-4 sm:size-5" strokeWidth={3} />
                ) : s.state === "current" ? (
                  <Clock aria-hidden className="size-4 sm:size-5" />
                ) : (
                  <span aria-hidden className="size-1.5 rounded-full bg-current" />
                )}
                <span className="sr-only">
                  Step {i + 1} of {n}: {s.label} — {SR_STATUS[s.state]}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* labels, aligned to the nodes by sharing the same grid */}
      <div className="mt-3 grid gap-x-2" style={cols}>
        {steps.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1 text-center">
            <span
              className={cn(
                "text-body-sm text-balance",
                s.state === "upcoming" ? "text-fg-tertiary" : "font-bold text-foreground",
              )}
            >
              {/* Parentheses mark the current step in text, not just in colour. */}
              {s.state === "current" ? `(${s.label})` : s.label}
            </span>
            {s.hint && <span className="text-caption text-fg-tertiary">{s.hint}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
