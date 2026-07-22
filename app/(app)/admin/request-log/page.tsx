"use client";

import { useMemo, useState } from "react";
import { Globe, Calculator, Monitor, Terminal, Cpu, Plug } from "lucide-react";
import { AdminGate } from "@/components/admin-gate";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  RMS_REQUESTS,
  CHANNEL_META,
  requestsByChannel,
  type RequestChannel,
} from "@/lib/data";
import { money, fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const CHANNEL_ICON: Record<RequestChannel, LucideIcon> = {
  manager_ui: Monitor,
  jumbobee_public: Globe,
  website_calc: Calculator,
  api: Plug,
  cli: Terminal,
  mcp: Cpu,
};

const ANONYMOUS_CHANNELS: RequestChannel[] = ["jumbobee_public", "website_calc"];
const CHANNELS = Object.keys(CHANNEL_META) as RequestChannel[];

const CHANNEL_TONE: Record<RequestChannel, StatusTone> = {
  manager_ui: "info",
  jumbobee_public: "warning",
  website_calc: "positive",
  api: "info",
  cli: "neutral",
  mcp: "neutral",
};

function statusTone(status: number): StatusTone {
  if (status >= 200 && status < 300) return "positive";
  if (status >= 400 && status < 500) return "warning";
  return "negative";
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${fmtDate(iso)} · ${hh}:${mm}`;
}

export default function RequestLogPage() {
  const [channel, setChannel] = useState<RequestChannel | "all">("all");

  const counts = useMemo(() => requestsByChannel(), []);

  const rows = useMemo(() => {
    const list = channel === "all" ? RMS_REQUESTS : RMS_REQUESTS.filter((r) => r.channel === channel);
    return [...list].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [channel]);

  return (
    <AdminGate>
      <div className="space-y-6">
        <PageHeader
          title="RMS Request Log"
          description="Every call to the single RMS rate service — internal manager UI, the public JumboBee calculator, client-facing website calculators, and API / CLI / MCP callers."
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CHANNELS.map((c) => {
            const meta = CHANNEL_META[c];
            const anon = ANONYMOUS_CHANNELS.includes(c);
            return (
              <StatCard
                key={c}
                label={meta.label}
                value={counts[c]}
                sub={anon ? `${meta.blurb} · anonymous client traffic` : meta.blurb}
                icon={CHANNEL_ICON[c]}
                accent={anon ? "warning" : "primary"}
              />
            );
          })}
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-center gap-2 p-4">
            <span className="mr-1 text-sm font-medium">Channel</span>
            <button onClick={() => setChannel("all")}>
              <Badge
                variant="secondary"
                className={cn(
                  "cursor-pointer",
                  channel === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                All
              </Badge>
            </button>
            {CHANNELS.map((c) => (
              <button key={c} onClick={() => setChannel(c)}>
                <Badge
                  variant={channel === c ? `status-${CHANNEL_TONE[c]}` : "secondary"}
                  className={cn(
                    "cursor-pointer",
                    channel === c ? "ring-2 ring-offset-1 ring-primary/40" : "bg-muted text-muted-foreground",
                  )}
                >
                  {CHANNEL_META[c].label}
                </Badge>
              </button>
            ))}
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
              {rows.length} request{rows.length === 1 ? "" : "s"}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Lane / commodity</TableHead>
                  <TableHead>Caller</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                  <TableHead className="text-right">Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const anonymous = r.caller.toLowerCase().includes("anonymous");
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                        {timeLabel(r.at)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={CHANNEL_TONE[r.channel]} dot={false} className="font-normal">
                          {CHANNEL_META[r.channel].label}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.endpoint}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">{r.method}</span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.lane || r.commodity ? (
                          <div className="space-y-0.5">
                            {r.lane && <div>{r.lane}</div>}
                            {r.commodity && <div className="text-xs text-muted-foreground">{r.commodity}</div>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "font-mono text-xs",
                            anonymous ? "rounded bg-status-warning-bg px-1.5 py-0.5 text-status-warning-fg" : "text-muted-foreground",
                          )}
                        >
                          {r.caller}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge tone={statusTone(r.status)} dot={false} className="tabular-nums">
                          {r.status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{r.latencyMs} ms</TableCell>
                      <TableCell className="text-right text-sm font-medium tabular-nums">
                        {r.resultTotal != null ? money(r.resultTotal) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminGate>
  );
}
