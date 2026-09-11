import {
  ClipboardCheck, Truck, Forklift, Warehouse, Ship, MapPin, TrainFront, Plane, ArrowRight,
} from "lucide-react";
import { CountryFlag, LocationName } from "@/components/location-label";
import { cn } from "@/lib/utils";
import { money } from "@/lib/format";
import { legTotal } from "@/lib/quote-engine";
import type { QuoteLeg, LegKind } from "@/lib/types";

const LEG_ICON: Record<LegKind, typeof Truck> = {
  preparation: ClipboardCheck,
  inland: Truck,
  loading: Forklift,
  cfs: Warehouse,
  drayage: Truck,
  ocean: Ship,
  oncarriage: MapPin,
};

function iconFor(leg: QuoteLeg) {
  if (leg.mode === "Rail") return TrainFront;
  if (leg.mode === "Air") return Plane;
  if (leg.kind === "ocean") return Ship;
  return LEG_ICON[leg.kind];
}

const LEG_LABEL: Record<LegKind, string> = {
  preparation: "Prep",
  inland: "Trucking",
  loading: "Loading",
  cfs: "CFS",
  drayage: "Drayage",
  ocean: "Ocean",
  oncarriage: "On-carriage",
};

/** Horizontal POL → … → POD stage visualization (Wisor-style). */
export function LegStages({
  legs,
  showPrices = true,
  compact = false,
  className,
}: {
  legs: QuoteLeg[];
  showPrices?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const shown = legs.filter((l) => l.included);
  return (
    <div className={cn("flex flex-wrap items-stretch gap-1", className)}>
      {shown.map((leg, i) => {
        const Icon = iconFor(leg);
        return (
          <div key={leg.id} className="flex items-stretch">
            <div
              className={cn(
                "flex flex-col gap-0.5 rounded-lg border bg-card px-3 py-2",
                compact ? "min-w-[96px]" : "min-w-[120px]",
                leg.kind === "ocean" && "border-primary/30 bg-primary/[0.03]",
              )}
            >
              <div className="flex items-center gap-1.5 text-caption font-medium uppercase tracking-wide text-muted-foreground">
                <Icon className="size-3.5 text-primary" />
                {LEG_LABEL[leg.kind]}
              </div>
              <div className={cn("font-medium leading-tight", compact ? "text-xs" : "text-sm")}>
                {leg.kind === "ocean" && leg.toPlace ? (
                  <span className="flex items-center gap-1">
                    <CountryFlag cc={leg.toPlace.countryCode} className="text-sm" />
                    <LocationName point={{ kind: "port", ...leg.toPlace }} />
                  </span>
                ) : (
                  leg.to
                )}
              </div>
              {showPrices && (
                <div className="text-xs font-semibold tabular-nums text-foreground/80">{money(legTotal(leg))}</div>
              )}
            </div>
            {i < shown.length - 1 && (
              <div className="flex items-center px-0.5 text-muted-foreground/50">
                <ArrowRight className="size-4" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
