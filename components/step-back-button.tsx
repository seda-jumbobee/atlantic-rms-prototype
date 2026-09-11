"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ============================================================================
   Step-back navigation — the one way a multi-step flow offers "go back".

   Renders above the progress stepper, so the reader meets the way out before
   the map of where they are. It is a 32px outline button (Figma Size=32), NOT
   a primary fill and not a bare text link: going back is a real control, but
   it must never read as the step's call to action — that lives in the
   ActionBar at the bottom.
   ========================================================================= */

export function StepBackButton({
  label,
  onClick,
  href,
  className,
}: {
  label: string;
  /** A step within a flow goes back by changing state… */
  onClick?: () => void;
  /** …a detail page goes back by navigating. Same control either way. */
  href?: string;
  className?: string;
}) {
  const body = (
    <>
      <ArrowLeft aria-hidden data-icon="inline-start" className="size-4" />
      {label}
    </>
  );
  return (
    <Button
      asChild={!!href}
      type={href ? undefined : "button"}
      variant="outline"
      size="sm"
      onClick={href ? undefined : onClick}
      className={cn("self-start", className)}
    >
      {href ? <Link href={href}>{body}</Link> : body}
    </Button>
  );
}
