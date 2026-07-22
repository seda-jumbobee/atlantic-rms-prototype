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
}: {
  value?: LocationValue;
  onChange: (v: LocationValue) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="h-10 w-full justify-between font-normal">
          {value ? (
            <span className="flex items-center gap-2 truncate">
              {value.kind === "port" ? <Anchor className="size-4 shrink-0 text-primary" /> : <MapPin className="size-4 shrink-0 text-status-info-fg" />}
              <span className="truncate">{value.label}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
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
              {PORTS.map((p) => {
                const label = `${p.name}, ${p.country} · ${p.locode}`;
                return (
                  <CommandItem
                    key={p.id}
                    value={label}
                    onSelect={() => { onChange({ kind: "port", id: p.id, label }); setOpen(false); }}
                  >
                    <Anchor className="size-4 text-primary" />
                    <span>{p.name}, {p.country}</span>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">{p.locode}</span>
                    {value?.id === p.id && <Check className="ml-1 size-4" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandGroup heading="Addresses (door)">
              {ADDRESSES.map((a) => (
                <CommandItem
                  key={a.id}
                  value={a.label}
                  onSelect={() => { onChange({ kind: "address", id: a.id, label: a.label }); setOpen(false); }}
                >
                  <MapPin className="size-4 text-status-info-fg" />
                  <span className="truncate">{a.label}</span>
                  {value?.id === a.id && <Check className="ml-1 size-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
