import { cn } from "@/lib/utils";
import { getCarrier } from "@/lib/data/carriers";

/** Brand-colored monogram chip standing in for a real carrier logo. */
export function CarrierLogo({
  carrierId,
  size = "md",
  showName = false,
  className,
}: {
  carrierId?: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}) {
  const carrier = getCarrier(carrierId);
  const dims =
    size === "sm" ? "h-7 min-w-7 text-[10px] px-1.5" : size === "lg" ? "h-12 min-w-12 text-sm px-2.5" : "h-9 min-w-9 text-[11px] px-2";
  if (!carrier) {
    return (
      <div className={cn("grid place-items-center rounded-md bg-muted font-semibold text-muted-foreground", dims, className)}>
        N/A
      </div>
    );
  }
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn("grid place-items-center rounded-md font-bold text-white shadow-sm", dims)}
        style={{ backgroundColor: carrier.color }}
        title={carrier.name}
      >
        {carrier.monogram}
      </div>
      {showName && <span className="text-sm font-medium">{carrier.name}</span>}
    </div>
  );
}
