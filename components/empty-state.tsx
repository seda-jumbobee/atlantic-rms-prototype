import * as React from "react";
import { SearchX, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  actionLabel,
  onAction,
  action,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-8 py-10",
        className
      )}
      {...props}
    >
      <div
        data-slot="empty-state-icon"
        className="flex size-12 items-center justify-center rounded-full bg-muted"
      >
        <Icon className="size-5.5 text-muted-foreground" />
      </div>
      <div
        data-slot="empty-state-title"
        className="text-base leading-6 font-medium tracking-tight"
      >
        {title}
      </div>
      {description && (
        <p
          data-slot="empty-state-description"
          className="text-center text-sm text-muted-foreground"
        >
          {description}
        </p>
      )}
      {action ??
        (actionLabel && (
          <Button size="sm" className="px-3.5" onClick={onAction}>
            {actionLabel}
          </Button>
        ))}
    </div>
  );
}
