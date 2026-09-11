"use client";

import { useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  CountryFlag, LocationName, locationPoint, type LocationPoint,
} from "@/components/location-label";
import { PORTS, ADDRESSES } from "@/lib/data/ports";
import type { AddressPoint, Port } from "@/lib/types";

export interface LocationValue {
  kind: "port" | "address";
  id: string;
  label: string;
}

/* A row and the trigger show slightly different things for the two kinds, and
   deliberately so: a port reads as city + country, but several addresses can
   share a city, so an address reads as the street line that identifies it.
   That leaves an address with no country to set in medium — the flag carries
   it, and appending the country would only push the street into the ellipsis. */
const portPoint = (p: Port): LocationPoint => ({
  kind: "port", name: p.name, country: p.country, countryCode: p.countryCode, code: p.locode,
});
const addressPoint = (a: AddressPoint): LocationPoint => ({
  kind: "address", name: a.label, countryCode: a.countryCode,
});

function pickedPoint(value: LocationValue): LocationPoint | null {
  if (value.kind === "port") return locationPoint("port", value.id);
  const a = ADDRESSES.find((x) => x.id === value.id);
  return a ? addressPoint(a) : null;
}

/** Option name that truncates with an ellipsis and shows the project tooltip
    (full name · country · LOCODE) only when the text is actually clipped.
    Fires on hover; screen readers read the full text from the option content. */
function OptionName({ full, className, children }: { full: string; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <Tooltip
      open={open}
      onOpenChange={(next) => {
        const el = ref.current;
        setOpen(next && !!el && el.scrollWidth > el.clientWidth + 1);
      }}
    >
      <TooltipTrigger asChild>
        <span ref={ref} className={cn("truncate", className)}>{children}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="z-[70]">{full}</TooltipContent>
    </Tooltip>
  );
}

export function LocationCombobox({
  value,
  onChange,
  placeholder = "Search port or address…",
  id,
  disabledId,
  disabledReason,
  menuAlign = "start",
  describedBy,
  invalid,
}: {
  value?: LocationValue;
  onChange: (v: LocationValue) => void;
  placeholder?: string;
  id?: string;
  /** id of an error message describing this field (aria-describedby). */
  describedBy?: string;
  /** mark the trigger invalid for assistive tech. */
  invalid?: boolean;
  /** Keep this location id in the list but disabled (it's already chosen on the
      other end of the route). Compared by unique id, so only the exact port /
      address is disabled — not others in the same city. */
  disabledId?: string;
  /** Inline note shown on the disabled option, e.g. "Selected as origin". */
  disabledReason?: string;
  /** Which edge stays anchored to the input; the wider menu grows the other way.
      "start" = left edge fixed, grows right (Origin);
      "end" = right edge fixed, grows left (Destination). */
  menuAlign?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const valueRef = useRef<HTMLSpanElement>(null);
  const picked = value ? pickedPoint(value) : null;
  const disabledCls =
    "data-[disabled=true]:pointer-events-auto data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-100 data-[disabled=true]:text-muted-foreground";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Tooltip on the selected value — hover + keyboard focus, only when truncated,
          suppressed while the menu is open. */}
      <Tooltip
        open={value ? tipOpen && !open : false}
        onOpenChange={(next) => {
          const el = valueRef.current;
          setTipOpen(next && !!el && el.scrollWidth > el.clientWidth + 1);
        }}
      >
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button id={id} variant="outline" role="combobox" aria-describedby={describedBy} aria-invalid={invalid || undefined} className="h-10 w-full justify-between border-[var(--c-input-border)] text-left font-normal hover:border-[var(--c-input-border-hover)]">
              {value ? (
                <span className="flex min-w-0 flex-1 items-center gap-1.5">
                  <CountryFlag cc={picked?.countryCode} />
                  <span className="sr-only">{value.kind === "port" ? "Port:" : "Address:"}</span>
                  {/* The LOCODE sits INSIDE the truncating span, so in a narrow
                      field it is the first thing to go rather than squeezing
                      the name it merely repeats. Being an inline run, it needs
                      a real space in front of it: a margin is invisible to a
                      screen reader and to a copied selection. */}
                  <span ref={valueRef} className="min-w-0 truncate">
                    {picked ? <LocationName point={picked} /> : value.label}
                    {picked?.code && (
                      <>
                        {" "}
                        <span className="ml-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                          {picked.code}
                        </span>
                      </>
                    )}
                  </span>
                </span>
              ) : (
                <span className="min-w-0 flex-1 truncate text-left text-muted-foreground">{placeholder}</span>
              )}
              <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" className="z-[70]">{value?.label}</TooltipContent>
      </Tooltip>

      <PopoverContent
        align={menuAlign}
        className="w-[var(--radix-popover-trigger-width)] max-w-[var(--radix-popover-content-available-width)] p-0 sm:w-96"
      >
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No location found.</CommandEmpty>
            <CommandGroup heading="Ports (UN/LOCODE)">
              {PORTS.map((p) => {
                const label = `${p.name}, ${p.country} · ${p.locode}`;
                const disabled = p.id === disabledId;
                return (
                  <CommandItem
                    key={p.id}
                    value={label}
                    disabled={disabled}
                    onSelect={disabled ? undefined : () => { onChange({ kind: "port", id: p.id, label }); setOpen(false); }}
                    className={cn("[&>svg:last-child]:hidden", disabled && disabledCls)}
                  >
                    <CountryFlag cc={p.countryCode} />
                    <OptionName full={label} className="min-w-0 flex-1">
                      <LocationName point={portPoint(p)} />
                    </OptionName>
                    {disabled ? (
                      <span className="shrink-0 text-xs text-muted-foreground">{disabledReason}</span>
                    ) : (
                      <>
                        {value?.id === p.id && <Check className="size-4 shrink-0" />}
                        <span className="shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">{p.locode}</span>
                      </>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandGroup heading="Addresses (door)">
              {ADDRESSES.map((a) => {
                const disabled = a.id === disabledId;
                return (
                  <CommandItem
                    key={a.id}
                    value={a.label}
                    disabled={disabled}
                    onSelect={disabled ? undefined : () => { onChange({ kind: "address", id: a.id, label: a.label }); setOpen(false); }}
                    className={cn("[&>svg:last-child]:hidden", disabled && disabledCls)}
                  >
                    <CountryFlag cc={a.countryCode} />
                    <OptionName full={a.label} className="min-w-0 flex-1">
                      <LocationName point={addressPoint(a)} />
                    </OptionName>
                    {disabled ? (
                      <span className="shrink-0 text-xs text-muted-foreground">{disabledReason}</span>
                    ) : (
                      value?.id === a.id && <Check className="size-4 shrink-0" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
