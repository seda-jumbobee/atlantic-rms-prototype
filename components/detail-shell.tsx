"use client";

import { Card } from "@/components/ui/card";
import { StepBackButton } from "@/components/step-back-button";
import { cn } from "@/lib/utils";

/* ============================================================================
   The shape every admin detail page takes — a vendor, a rate, an invoice.

   One layout rather than one per entity: back, then who this is and what state
   it is in, then the primary action, then sections. A reader who has opened a
   vendor already knows where to look when they open a rate.

   The header keeps the title and the status on the same line as the action, so
   the answer to "what is this and what can I do with it" does not require
   scrolling past a block of metadata first.
   ========================================================================= */

export function DetailShell({
  backHref,
  backLabel,
  title,
  subtitle,
  status,
  actions,
  children,
  className,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  subtitle?: React.ReactNode;
  /** A StatusBadge, normally. */
  status?: React.ReactNode;
  /** The page's primary control, and any overflow beside it. */
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-1 flex-col gap-6", className)}>
      <StepBackButton label={backLabel} href={backHref} />

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-h2 break-words text-foreground">{title}</h1>
            {status}
          </div>
          {subtitle && <div className="text-body text-muted-foreground">{subtitle}</div>}
        </div>
        {/* Full width on a phone so the primary action is a real target. */}
        {actions && (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center [&_button]:w-full sm:[&_button]:w-auto">
            {actions}
          </div>
        )}
      </header>

      {children}
    </div>
  );
}

/** A titled block inside a detail page. */
export function DetailSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <Card asChild className={cn("gap-4 p-5", className)}>
      <section aria-labelledby={id}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={id} className="text-h4 text-foreground">{title}</h2>
            {description && <p className="text-body text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
        {children}
      </section>
    </Card>
  );
}

/** Label above value, the reading order this product uses everywhere a record
    is described. Two columns by default so a pair does not stretch across a
    whole page. */
export function DetailGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {children}
    </dl>
  );
}

export function DetailItem({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-body break-words text-foreground">{children}</dd>
    </div>
  );
}
