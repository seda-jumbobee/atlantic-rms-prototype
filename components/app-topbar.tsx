"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, LogOut, UserCog, ChevronsUpDown, ShieldCheck, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSession } from "@/components/session-provider";
import { DEALS } from "@/lib/data/deals";
import { CALCULATORS } from "@/lib/data/calculators";

const NAV = [
  { label: "RMS Home", href: "/" },
  { label: "Quote Master", href: "/quote-master" },
  { label: "Route Builder", href: "/route-builder" },
  { label: "Deals & CRM", href: "/deals" },
  { label: "History", href: "/history" },
];

export function AppTopbar() {
  const { user, logout, setRole } = useSession();
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
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur">
      <SidebarTrigger className="text-muted-foreground" />
      <Separator orientation="vertical" className="mr-1 h-5" />

      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-xs items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground transition hover:bg-muted"
      >
        <Search className="size-4" />
        <span>Search lanes, deals, carriers…</span>
        <kbd className="ml-auto hidden rounded border bg-background px-1.5 text-caption sm:inline">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        {/* Demo role switch */}
        <div className="hidden items-center rounded-md border p-0.5 sm:flex">
          <Button
            size="sm"
            variant={user?.role === "manager" ? "default" : "ghost"}
            className="h-7 gap-1.5 px-2.5 text-xs"
            onClick={() => setRole("manager")}
          >
            <UserIcon className="size-3.5" /> Manager
          </Button>
          <Button
            size="sm"
            variant={user?.role === "admin" ? "default" : "ghost"}
            className="h-7 gap-1.5 px-2.5 text-xs"
            onClick={() => setRole("admin")}
          >
            <ShieldCheck className="size-3.5" /> Admin
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2">
              <Avatar className="size-7">
                <AvatarFallback style={{ backgroundColor: user?.avatarColor, color: "white" }} className="text-xs">
                  {user?.initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left leading-tight md:block">
                <div className="text-xs font-medium">{user?.name}</div>
                <div className="text-caption text-muted-foreground">{user?.title}</div>
              </div>
              <ChevronsUpDown className="hidden size-3.5 text-muted-foreground md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="flex items-center justify-between gap-2">
              <span className="truncate">{user?.email}</span>
              <Badge variant={user?.role === "admin" ? "default" : "secondary"} className="shrink-0 capitalize">
                {user?.role === "admin" ? "Procurement" : "Manager"}
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setRole(user?.role === "admin" ? "manager" : "admin")}>
              <UserCog className="size-4" /> View as {user?.role === "admin" ? "Manager" : "Admin"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { logout(); router.push("/login"); }}>
              <LogOut className="size-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
    </header>
  );
}
