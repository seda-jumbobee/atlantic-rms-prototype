import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const iconTileVariants = cva(
  "flex shrink-0 items-center justify-center overflow-hidden rounded-lg",
  {
    variants: {
      size: {
        sm: "size-8 [&>svg]:size-4",
        md: "size-9 [&>svg]:size-[18px]",
        lg: "size-10 [&>svg]:size-5",
      },
      variant: {
        primary: "bg-primary/10 text-primary",
        muted: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "muted",
    },
  }
);

function IconTile({
  className,
  size,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof iconTileVariants>) {
  return (
    <div
      data-slot="icon-tile"
      aria-hidden="true"
      className={cn(iconTileVariants({ size, variant }), className)}
      {...props}
    />
  );
}

export function StatCard({
  label, value, sub, icon: Icon, accent, className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  accent?: "primary" | "success" | "warning" | "destructive";
  className?: string;
}) {
  const accentColor =
    accent === "success" ? "text-success" : accent === "warning" ? "text-warning"
    : accent === "destructive" ? "text-destructive" : "text-primary";
  return (
    <Card className={cn("min-w-0 flex-row items-start justify-between gap-2 p-4", className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      {Icon && (
        <IconTile className={cn("[&>svg]:size-4", accentColor)}>
          <Icon />
        </IconTile>
      )}
    </Card>
  );
}

export { IconTile, iconTileVariants };
