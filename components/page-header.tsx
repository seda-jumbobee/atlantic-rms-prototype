import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      {/* text-h3 (20/26/-0.5%) is the page title in the Dashboard reference;
          the type ramp carries the weight and tracking, not local utilities. */}
      <div className="flex flex-col gap-1">
        <h1 className="text-h3 text-foreground">{title}</h1>
        {description && <p className="text-body text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex items-start gap-2">{children}</div>}
    </div>
  );
}
