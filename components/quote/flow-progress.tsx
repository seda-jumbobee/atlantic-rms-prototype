"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FlowStep {
  key: string;
  label: string;
}

type State = "done" | "active" | "upcoming";

/* ============================================================================
   Step progress for the Rate Quote and Custom Route flows.

   Layout: every step is flush to the left of its column — node, caption and
   label share one left edge, and the connector fills the gap to the right.
   Nothing is centred, so the track starts at the content's left margin.

   Colour follows the supplied reference: finished steps are the design
   system's success green, the step underway is the brand secondary accent.

   Two contrast constraints shape how those are applied, both measured:
     • The accent #FFB051 is a LIGHT colour. A glyph on it must be dark —
       white is 1.8133 and fails. The on-secondary token is 10.2902.
     • #FFB051 as a 2px rule on white is also 1.8133, under the 3:1 that a
       meaningful graphic needs, so the connector leaving the current step
       uses secondary/500 (3.6825) rather than the accent itself. Same brand
       ramp, visible at stroke width.
   Success green carries a white check at 4.5184 and rules at 4.5184.

   State is never carried by colour alone: each node has a distinct glyph, the
   current step is aria-current, and the written status — no longer drawn as a
   chip — is still announced via an sr-only word.
   ========================================================================= */

const STATUS: Record<State, string> = {
  done: "Completed",
  active: "In progress",
  upcoming: "Pending",
};

function Node({ state }: { state: State }) {
  return (
    <span
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full transition-colors",
        state === "done" && "bg-success text-success-foreground",
        // dark glyph on the accent — white would be 1.8133
        state === "active" &&
          "bg-brand-secondary text-brand-secondary-foreground ring-4 ring-brand-secondary-subtle",
        state === "upcoming" && "border border-border-divider bg-card text-fg-disabled",
      )}
    >
      {state === "done" ? (
        <Check aria-hidden className="size-5" strokeWidth={3} />
      ) : state === "active" ? (
        <span aria-hidden className="size-2.5 rounded-full bg-current" />
      ) : null /* an empty ring: the number would only repeat the STEP n label
                  directly beneath it */}
    </span>
  );
}

/** The connector leaving a node, filling the rest of that step's column. */
function Rule({ tone }: { tone: "done" | "active" | "idle" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "h-0.5 min-w-2 flex-1 rounded-full",
        tone === "done" && "bg-success",
        tone === "active" && "bg-gradient-to-r from-brand-secondary-active to-border-divider",
        tone === "idle" && "bg-border-divider",
      )}
    />
  );
}

export function FlowProgress({
  steps,
  current,
  onStepClick,
  ariaLabel = "Progress",
}: {
  steps: FlowStep[];
  current: number;
  /** Called with the index of a completed step when the user clicks it. */
  onStepClick: (index: number) => void;
  ariaLabel?: string;
}) {
  const stateOf = (i: number): State => (i === current ? "active" : i < current ? "done" : "upcoming");

  return (
    <nav aria-label={ariaLabel}>
      {/* sm and up — the full reference layout */}
      <ol
        className="hidden sm:grid"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((s, i) => {
          const state = stateOf(i);
          const body = (
            <span className="flex flex-col items-start gap-1 pr-3 text-left">
              <span className="text-caption tracking-wide text-fg-tertiary uppercase">
                Step {i + 1}
              </span>
              <span
                className={cn(
                  "text-body text-balance",
                  state === "upcoming" ? "text-fg-tertiary" : "font-bold text-foreground",
                )}
              >
                {s.label}
              </span>
              {/* The chip is gone from the design; the word is not, or state
                  would reach a screen reader as colour only. */}
              <span className="sr-only">{STATUS[state]}</span>
            </span>
          );

          return (
            <li key={s.key} className="flex min-w-0 flex-col items-start gap-3">
              <span className="flex w-full items-center gap-2">
                <Node state={state} />
                {i < steps.length - 1 && (
                  <Rule tone={state === "done" ? "done" : state === "active" ? "active" : "idle"} />
                )}
              </span>

              {state === "done" ? (
                <button
                  type="button"
                  onClick={() => onStepClick(i)}
                  aria-label={`Back to ${s.label}`}
                  className="rounded-md text-left transition-opacity hover:opacity-75"
                >
                  {body}
                </button>
              ) : (
                <span aria-current={state === "active" ? "step" : undefined}>{body}</span>
              )}
            </li>
          );
        })}
      </ol>

      {/* below sm — four columns of labels will not fit, so the nodes carry the
          shape of the flow and one line says where you are */}
      <div className="flex flex-col gap-2 sm:hidden">
        <ol className="flex items-center gap-2">
          {steps.map((s, i) => {
            const state = stateOf(i);
            return (
              <li key={s.key} className="flex min-w-0 flex-1 items-center gap-2 last:flex-none">
                {state === "done" ? (
                  <button
                    type="button"
                    onClick={() => onStepClick(i)}
                    aria-label={`Back to ${s.label}`}
                    className="rounded-full"
                  >
                    <Node state={state} />
                  </button>
                ) : (
                  <span aria-current={state === "active" ? "step" : undefined}>
                    <Node state={state} />
                  </span>
                )}
                {i < steps.length - 1 && (
                  <Rule tone={state === "done" ? "done" : state === "active" ? "active" : "idle"} />
                )}
              </li>
            );
          })}
        </ol>
        <p className="text-body">
          <span className="text-fg-tertiary">
            Step {current + 1} of {steps.length} ·{" "}
          </span>
          <span className="font-bold text-foreground">{steps[current]?.label}</span>
        </p>
      </div>
    </nav>
  );
}
