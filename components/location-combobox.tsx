"use client";

import { useState } from "react";
import { Anchor, MapPin, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { PORTS, ADDRESSES } from "@/lib/data/ports";

export interface LocationValue {
  kind: "port" | "address";
  id: string;
  label: string;
}

export function LocationCombobox({
  value,
  onChange,
  placeholder = "Search port or address…",
  id,
  excludeId,
}: {
  value?: LocationValue;
  onChange: (v: LocationValue) => void;
  placeholder?: string;
  id?: string;
  /** Hide this location id from the list (e.g. the other end of the route,
      so origin and destination can never be the same). */
  excludeId?: string;
}) {
  const [open, setOpen] = useState(false);
  const ports = PORTS.filter((p) => p.id !== excludeId);
  const addresses = ADDRESSES.filter((a) => a.id !== excludeId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" role="combobox" className="h-10 w-full justify-between font-normal">
          {value ? (
            <span className="flex min-w-0 flex-1 items-center gap-2">
              {value.kind === "port" ? <Anchor className="size-4 shrink-0 text-primary" /> : <MapPin className="size-4 shrink-0 text-status-info-fg" />}
              <span className="truncate">{value.label}</span>
            </span>
          ) : (
            <span className="min-w-0 flex-1 truncate text-left text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No location found.</CommandEmpty>
            <CommandGroup heading="Ports (UN/LOCODE)">
              {ports.map((p) => {
                const label = `${p.name}, ${p.country} · ${p.locode}`;
                return (
                  <CommandItem
                    key={p.id}
                    value={label}
                    onSelect={() => { onChange({ kind: "port", id: p.id, label }); setOpen(false); }}
                    className="[&>svg:last-child]:hidden"
                  >
                    <Anchor className="size-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate">{p.name}, {p.country}</span>
                    {value?.id === p.id && <Check className="size-4 shrink-0" />}
                    <span className="shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">{p.locode}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandGroup heading="Addresses (door)">
              {addresses.map((a) => (
                <CommandItem
                  key={a.id}
                  value={a.label}
                  onSelect={() => { onChange({ kind: "address", id: a.id, label: a.label }); setOpen(false); }}
                >
                  <MapPin className="size-4 shrink-0 text-status-info-fg" />
                  <span className="min-w-0 flex-1 truncate">{a.label}</span>
                  {value?.id === a.id && <Check className="size-4 shrink-0" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
