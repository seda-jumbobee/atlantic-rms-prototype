"use client";

import { useRef, useState } from "react";
import { Anchor, MapPin, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PORTS, ADDRESSES } from "@/lib/data/ports";

export interface LocationValue {
  kind: "port" | "address";
  id: string;
  label: string;
}

/** Option name that truncates with an ellipsis and shows the project tooltip
    (full name · country · LOCODE) only when the text is actually clipped.
    Fires on hover; screen readers read the full text from the option content. */
function OptionName({ text, full, className }: { text: string; full: string; className?: string }) {
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
        <span ref={ref} className={cn("truncate", className)}>{text}</span>
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
            <Button id={id} variant="outline" role="combobox" aria-describedby={describedBy} aria-invalid={invalid || undefined} className="h-10 w-full justify-between border-[var(--c-input-border)] font-normal hover:border-[var(--c-input-border-hover)]">
              {value ? (
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  {value.kind === "port" ? <Anchor className="size-4 shrink-0 text-primary" /> : <MapPin className="size-4 shrink-0 text-status-info-fg" />}
                  <span ref={valueRef} className="min-w-0 truncate">{value.label}</span>
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
                    <Anchor className="size-4 shrink-0 text-primary" />
                    <OptionName text={`${p.name}, ${p.country}`} full={label} className="min-w-0 flex-1" />
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
                    <MapPin className="size-4 shrink-0 text-status-info-fg" />
                    <OptionName text={a.label} full={a.label} className="min-w-0 flex-1" />
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
