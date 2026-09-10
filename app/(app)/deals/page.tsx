"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, Table as TableIcon, Briefcase, Trophy, FolderOpen, Percent } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { DealStageBadge } from "@/components/status-badge";
import { DealBoard } from "@/components/deals/deal-board";
import { ManagerAvatar } from "@/components/deals/manager-avatar";
import { CreateDealDialog } from "@/components/deals/create-deal-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEALS, getCustomer, getUser } from "@/lib/data";
import { money } from "@/lib/format";

const OPEN_STAGES = new Set(["Incoming Lead", "Qualification", "Quote Sent", "Negotiation"]);

function laneOf(d: (typeof DEALS)[number]): string {
  const parts = [d.origin, d.pol, d.pod, d.destination].filter(Boolean);
  return parts.length ? parts.join(" → ") : "—";
}

export default function DealsPage() {
  const [view, setView] = useState<"board" | "table">("board");

  const stats = useMemo(() => {
    const pipeline = DEALS.filter((d) => OPEN_STAGES.has(d.stage)).reduce((s, d) => s + (d.sale ?? 0), 0);
    const won = DEALS.filter((d) => d.stage === "Confirmed (Won)");
    const wonValue = won.reduce((s, d) => s + (d.sale ?? 0), 0);
    const open = DEALS.filter((d) => OPEN_STAGES.has(d.stage)).length;
    const closed = DEALS.filter((d) => d.stage === "Confirmed (Won)" || d.stage === "Lost").length;
    const winRate = closed ? Math.round((won.length / closed) * 100) : 0;
    return { pipeline, wonValue, wonCount: won.length, open, winRate };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Deals & CRM" description="Atlantic Project Cargo pipeline — synced with Kommo CRM.">
        <div className="flex items-center gap-2">
          <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && setView(v as "board" | "table")}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="board" aria-label="Board view">
            <LayoutGrid className="size-4" /> Board
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Table view">
            <TableIcon className="size-4" /> Table
          </ToggleGroupItem>
          </ToggleGroup>
          <CreateDealDialog />
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pipeline value" value={money(stats.pipeline)} sub="Open deals" icon={Briefcase} accent="primary" />
        <StatCard label="Won value" value={money(stats.wonValue)} sub={`${stats.wonCount} confirmed`} icon={Trophy} accent="success" />
        <StatCard label="Open deals" value={stats.open} sub="In progress" icon={FolderOpen} accent="warning" />
        <StatCard label="Win rate" value={`${stats.winRate}%`} sub="Won / closed" icon={Percent} accent="primary" />
      </div>

      {view === "board" ? (
        <DealBoard deals={DEALS} />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Lane</TableHead>
                <TableHead className="text-right">Sale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEALS.map((d) => {
                const customer = getCustomer(d.customerId);
                const manager = getUser(d.managerId);
                return (
                  <TableRow key={d.id} className="cursor-pointer">
                    <TableCell className="max-w-[280px]">
                      <Link href={`/deals/${d.id}`} className="block truncate font-mono text-xs hover:underline" title={d.title}>
                        {d.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{customer?.company ?? "—"}</TableCell>
                    <TableCell><ManagerAvatar user={manager} /></TableCell>
                    <TableCell><DealStageBadge stage={d.stage} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{laneOf(d)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {d.sale != null ? money(d.sale) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
