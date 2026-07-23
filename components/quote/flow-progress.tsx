"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FlowStep {
  key: string;
  label: string;
}

/** Full-width step progress used across the Rate Quote and Custom Route flows.
    Completed steps are clickable to go back; the current step is aria-current;
    upcoming steps are inert. */
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
  return (
    <nav aria-label={ariaLabel} className="w-full">
      <ol className="flex w-full items-center gap-2 sm:gap-3">
        {steps.map((s, i) => {
          const state = i === current ? "active" : i < current ? "done" : "upcoming";
          const clickable = state === "done";
          const inner = (
            <>
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-xs font-medium transition",
                  state === "active" && "bg-primary text-primary-foreground",
                  state === "done" && "bg-primary/15 text-primary",
                  state === "upcoming" && "bg-muted text-muted-foreground",
                )}
              >
                {state === "done" ? <Check className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden whitespace-nowrap text-sm md:inline",
                  state === "active" && "font-semibold text-foreground",
                  state === "done" && "font-medium text-foreground",
                  state === "upcoming" && "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </>
          );
          return (
            <li key={s.key} className={cn("flex min-w-0 items-center gap-2 sm:gap-3", i < steps.length - 1 && "flex-1")}>
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick(i)}
                  className="flex items-center gap-2 rounded-full outline-none transition hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  aria-label={`Back to ${s.label}`}
                >
                  {inner}
                </button>
              ) : (
                <div className="flex items-center gap-2" aria-current={state === "active" ? "step" : undefined}>
                  {inner}
                </div>
              )}
              {i < steps.length - 1 && (
                <span aria-hidden className={cn("h-0.5 min-w-4 flex-1 rounded-full", i < current ? "bg-primary" : "bg-border")} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
