"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Search, ListChecks, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { QuoteSearchWidget } from "@/components/quote/quote-search-widget";
import { ResultsView } from "@/components/quote/results-view";
import { QuoteEditor } from "@/components/quote/quote-editor";
import { decodeSearch } from "@/lib/search-params";
import { buildRateOptions, destinationRequirements } from "@/lib/quote-engine";
import { getPort, getAddress } from "@/lib/data/ports";
import { seeded } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RateOption } from "@/lib/types";

function locLabel(portId?: string, addrId?: string): string {
  const p = getPort(portId);
  if (p) return `${p.name}, ${p.country}`;
  const a = getAddress(addrId);
  return a?.city ?? a?.label ?? "—";
}

const STEPS = [
  { key: "search", label: "Search", icon: Search },
  { key: "choose", label: "Choose rate", icon: ListChecks },
  { key: "build", label: "Build quote", icon: FileText },
];

export function QuoteMaster() {
  const sp = useSearchParams();
  const input = useMemo(() => decodeSearch(sp), [sp]);
  const [selected, setSelected] = useState<RateOption | null>(null);

  const rates = useMemo(() => (input ? buildRateOptions(input) : []), [input]);
  const requirements = useMemo(() => (input ? destinationRequirements(input) : []), [input]);

  // ?edit=1 → reopen straight into the editable editor (edit a quoted rate & re-send)
  const editFlag = sp.get("edit") === "1";
  useEffect(() => {
    if (editFlag && input && !selected && rates.length) {
      setSelected(rates.find((r) => r.recommended) ?? rates[0]);
    }
  }, [editFlag, input, rates, selected]);

  const step = !input ? "search" : selected ? "build" : "choose";
  const origin = input ? locLabel(input.originPortId, input.originAddressId) : "";
  const destination = input ? locLabel(input.destPortId, input.destAddressId) : "";
  const quoteId = input ? `Q-${190600 + Math.floor(seeded(JSON.stringify(input)) * 380)}` : "Q-190600";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Quote Master" description="Search, compare and assemble an end-to-end project-cargo quote.">
        {input && (
          <div className="hidden text-sm text-muted-foreground sm:block">
            <span className="font-medium text-foreground">{origin}</span> → <span className="font-medium text-foreground">{destination}</span>
            <span className="mx-1.5">·</span>{input.commodityLabel || input.commodityKind}
          </div>
        )}
      </PageHeader>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const active = s.key === step;
          const done = STEPS.findIndex((x) => x.key === step) > i;
          return (
            <div key={s.key} className="flex flex-1 items-center gap-2">
              <div className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                active ? "border-primary bg-primary/5 font-medium text-primary" : done ? "text-success" : "text-muted-foreground",
              )}>
                <span className={cn(
                  "grid size-6 place-items-center rounded-full text-xs",
                  active ? "bg-primary text-primary-foreground" : done ? "bg-success text-white" : "bg-muted",
                )}>
                  {done ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={cn("h-px flex-1", done ? "bg-success" : "bg-border")} />}
            </div>
          );
        })}
      </div>

      {step === "search" && (
        <Card>
          <CardHeader>
            <CardTitle>Start a quote</CardTitle>
            <CardDescription>Choose origin & destination (port or address), then the commodity.</CardDescription>
          </CardHeader>
          <CardContent>
            <QuoteSearchWidget />
          </CardContent>
        </Card>
      )}

      {step === "choose" && input && (
        <ResultsView
          rates={rates}
          requirements={requirements}
          lane={`${origin} → ${destination}`}
          advanced={input.advancedSearch}
          onChoose={setSelected}
        />
      )}

      {step === "build" && selected && input && (
        <QuoteEditor
          rate={selected}
          quoteId={quoteId}
          origin={origin}
          destination={destination}
          commodityLabel={input.commodityLabel || input.commodityKind}
          shipmentType={input.shipmentType}
          onBack={() => setSelected(null)}
        />
      )}
    </div>
  );
}
