import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

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
    <Card className={cn("p-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        {Icon && (
          <div className={cn("grid size-9 place-items-center rounded-lg bg-muted", accentColor)}>
            <Icon className="size-4.5" />
          </div>
        )}
      </div>
    </Card>
  );
}
