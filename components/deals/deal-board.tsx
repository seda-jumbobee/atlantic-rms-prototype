"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { DealStageBadge } from "@/components/status-badge";
import { ManagerAvatar } from "@/components/deals/manager-avatar";
import { getCustomer, getUser, DEAL_STAGES } from "@/lib/data";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Deal } from "@/lib/types";

function DealCard({ deal }: { deal: Deal }) {
  const customer = getCustomer(deal.customerId);
  const manager = getUser(deal.managerId);
  return (
    <Link
      href={`/deals/${deal.id}`}
      className="block rounded-lg border bg-card p-3 shadow-xs transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <p className="truncate font-mono text-xs font-medium" title={deal.title}>
        {deal.title}
      </p>
      <p className="mt-1.5 truncate text-sm font-medium">{customer?.company ?? "—"}</p>
      <p className="text-xs text-muted-foreground">{deal.commodityType}</p>
      <div className="mt-2.5 flex items-center justify-between">
        <ManagerAvatar user={manager} />
        <span className="text-sm font-semibold tabular-nums">
          {deal.sale != null ? money(deal.sale) : "—"}
        </span>
      </div>
    </Link>
  );
}

export function DealBoard({ deals }: { deals: Deal[] }) {
  return (
    <div className="-mx-1 overflow-x-auto pb-2">
      <div className="flex min-w-max gap-3 px-1">
        {DEAL_STAGES.map((stage) => {
          const col = deals.filter((d) => d.stage === stage);
          const colTotal = col.reduce((s, d) => s + (d.sale ?? 0), 0);
          return (
            <div key={stage} className="flex w-72 flex-shrink-0 flex-col">
              <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
                <div className="flex items-center gap-2">
                  <DealStageBadge stage={stage} />
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    {col.length}
                  </span>
                </div>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {money(colTotal)}
                </span>
              </div>
              <Card className={cn("flex-1 gap-2 bg-muted/40 p-2", col.length === 0 && "min-h-24")}>
                {col.length === 0 ? (
                  <p className="grid h-full place-items-center py-6 text-xs text-muted-foreground">
                    No deals
                  </p>
                ) : (
                  col.map((d) => <DealCard key={d.id} deal={d} />)
                )}
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
