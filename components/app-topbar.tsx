"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DEALS } from "@/lib/data/deals";
import { CALCULATORS } from "@/lib/data/calculators";

const NAV = [
  { label: "Dashboard", href: "/" },
  { label: "Rate Quote", href: "/quote-master" },
  { label: "Custom Route", href: "/route-builder" },
  { label: "Deals & CRM", href: "/deals" },
  { label: "History", href: "/history" },
];

/* Top bar — Figma "04 - Screens / Dashboard".
   Search only. The account block moved to the bottom of the sidebar, so this
   row no longer carries a profile, a border or a background: it is simply the
   first row inside the content surface. */
export function AppTopbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="flex items-center gap-2 px-4 pt-4 sm:px-6 md:px-8 md:pt-8">
      {/* Below md the sidebar is an off-canvas sheet; this is its trigger. */}
      <SidebarTrigger className="text-muted-foreground md:hidden" />

      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-80 items-center gap-2 rounded-md border border-border bg-card px-3 text-body text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
      >
        <Search aria-hidden className="size-4" />
        <span className="truncate">Search lanes, deals, carriers…</span>
        <kbd className="ml-auto hidden rounded-sm border border-border bg-background px-1.5 font-mono text-caption sm:inline">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <Command>
            <CommandInput placeholder="Search lanes, deals, carriers, calculators…" />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Navigation">
                {NAV.map((n) => (
                  <CommandItem key={n.href} value={n.label} onSelect={() => go(n.href)}>
                    {n.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Calculators">
                {CALCULATORS.map((c) => (
                  <CommandItem key={c.id} value={c.name} onSelect={() => go(`/calculators/${c.id}`)}>
                    {c.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Recent deals">
                {DEALS.slice(0, 5).map((d) => (
                  <CommandItem key={d.id} value={d.title} onSelect={() => go(`/deals/${d.id}`)}>
                    <span className="truncate">{d.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  );
}
