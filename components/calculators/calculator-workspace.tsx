"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowLeftRight, ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CalculatorPanel } from "@/components/calculators/calculator-panels";
import { CALCULATORS, CALCULATOR_CATEGORY_LABEL, getCalculator } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { CalculatorCategory, CalculatorId } from "@/lib/types";

const CAT_ORDER: CalculatorCategory[] = ["freight-routing", "cargo-equipment", "costs-compliance"];

function SwitchCalculator({ currentId }: { currentId: CalculatorId }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<CalculatorId | null>(null);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeftRight className="size-4" /> Switch calculator
            <ChevronsUpDown className="size-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <Command>
            <CommandInput placeholder="Search calculators…" />
            <CommandList>
              <CommandEmpty>No calculators found.</CommandEmpty>
              {CAT_ORDER.map((cat) => (
                <CommandGroup key={cat} heading={CALCULATOR_CATEGORY_LABEL[cat]}>
                  {CALCULATORS.filter((c) => c.category === cat).map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`${c.name} ${CALCULATOR_CATEGORY_LABEL[cat]}`}
                      onSelect={() => {
                        setOpen(false);
                        if (c.id !== currentId) setPending(c.id);
                      }}
                    >
                      <Check className={cn("size-4", c.id === currentId ? "opacity-100" : "opacity-0")} />
                      <span className="min-w-0 flex-1 truncate">{c.name}</span>
                      {c.toolType === "rate-search" && <Badge variant="status-info" className="text-caption">Rate search</Badge>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch calculator?</AlertDialogTitle>
            <AlertDialogDescription>Your current unsaved inputs will be cleared.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep working</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (pending) router.push(`/calculators/${pending}`); }}>Switch calculator</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function CalculatorWorkspace({ id }: { id: CalculatorId }) {
  const meta = getCalculator(id)!;
  return (
    <div className="space-y-6">
      <Link
        href="/calculators"
        className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-primary outline-none transition hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4" /> Back to calculators
      </Link>

      <PageHeader title={meta.name} description={meta.description}>
        {meta.region && <Badge variant="outline">{meta.region}</Badge>}
        <SwitchCalculator currentId={meta.id} />
      </PageHeader>

      <CalculatorPanel id={meta.id} />
    </div>
  );
}
