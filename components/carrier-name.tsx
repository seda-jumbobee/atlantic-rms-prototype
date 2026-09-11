import { cn } from "@/lib/utils";
import { getCarrier } from "@/lib/data/carriers";

/* ============================================================================
   A carrier, named.

   Replaces the coloured monogram chip that used to stand in for a logo. The
   chip was invented brand furniture — a two-letter square in a colour we made
   up — and it cost a scan: "ONE" in a box reads as a logo you must decode,
   where "Ocean Network Express" reads as itself. Comparing rates is the whole
   job of this screen, and comparison is faster on words than on colours.

   One component so every surface says the carrier the same way: rate cards,
   filters, route stages, the rate library, integrations and the client-facing
   quote output.
   ========================================================================= */

export function CarrierName({
  carrierId,
  /** `strong` is for the card or row the carrier is the subject of. */
  emphasis = "default",
  className,
}: {
  carrierId?: string;
  emphasis?: "default" | "strong";
  className?: string;
}) {
  const carrier = getCarrier(carrierId);
  if (!carrier) {
    return <span className={cn("text-body text-muted-foreground", className)}>Unknown carrier</span>;
  }
  return (
    <span
      className={cn(
        "min-w-0 truncate",
        emphasis === "strong" ? "text-body-lg font-bold text-foreground" : "text-body font-medium text-foreground",
        className,
      )}
    >
      {carrier.name}
    </span>
  );
}
