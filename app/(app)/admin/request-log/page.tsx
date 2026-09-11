"use client";

import { useMemo, useState } from "react";
import { Globe, Calculator, Monitor, Terminal, Cpu, Plug } from "lucide-react";
import { AdminGate } from "@/components/admin-gate";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { CountryFlag } from "@/components/location-label";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { laneCountryCode } from "@/lib/quote-links";
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

/** The log is stamped in UTC and the column heading says so, so an hour is
    never read as the operator's own clock. */
function timeOfDay(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
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
      <div className="flex flex-col gap-6">
        <PageHeader
          title="RMS Request Log"
          description="Every call to the single RMS rate service — internal manager UI, the public JumboBee calculator, client-facing website calculators, and API / CLI / MCP callers."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Filter: the group title at body size, 10px above its control, the
            same as the rate filters on the quote screens. */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <span id="channel-filter-label" className="mb-2.5 block text-body font-medium text-foreground">
              Channel
            </span>
            {/* Seven surfaces never fit a phone: the strip scrolls on its own
                rather than widening the page. */}
            <Tabs value={channel} onValueChange={(v) => setChannel(v as RequestChannel | "all")}>
              <div className="min-w-0 overflow-x-auto pb-1">
                <TabsList aria-labelledby="channel-filter-label">
                  {/* This is the page's only control, so it keeps a 44px target
                      on a phone and drops to the dense height on a pointer. */}
                  <TabsTrigger value="all" className="max-sm:py-3">
                    All
                  </TabsTrigger>
                  {CHANNELS.map((c) => (
                    <TabsTrigger key={c} value={c} className="max-sm:py-3">
                      {CHANNEL_META[c].label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          </div>
          <p role="status" aria-live="polite" className="text-body text-muted-foreground tabular-nums">
            Showing {rows.length} of {RMS_REQUESTS.length} requests
          </p>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="No requests on this channel"
            description="Nothing reached the rate service through this surface in the window the log covers."
            action={
              <Button variant="outline" size="sm" onClick={() => setChannel("all")}>
                Show all channels
              </Button>
            }
          />
        ) : (
          <>
            {/* md+ : a chronological block read down its columns, so compact
                rows, and figures right-aligned on their digits. */}
            <div className="hidden md:block">
              <Table density="compact">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Time (UTC)</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Lane</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Caller</TableHead>
                    <TableHead>Status</TableHead>
                    {/* The unit rides in the heading: inside the cell it sat
                        between the figures and the right edge and no two
                        latencies lined up. */}
                    <TableHead numeric>Latency (ms)</TableHead>
                    <TableHead numeric>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="tabular-nums">
                        <span className="text-muted-foreground">{fmtDate(r.at)}</span>{" "}
                        <span className="font-medium">{timeOfDay(r.at)}</span>
                      </TableCell>
                      <TableCell>
                        <ChannelChip channel={r.channel} />
                      </TableCell>
                      <TableCell className="font-mono text-caption text-muted-foreground">{r.method}</TableCell>
                      {/* The free-text columns are capped and truncated so one
                          long query string cannot push the status and the money
                          off the end of the scroller. */}
                      <TableCell className="max-w-[16rem] truncate font-mono text-caption" title={r.endpoint}>
                        {r.endpoint}
                      </TableCell>
                      <TableCell className="max-w-[14rem] truncate" title={r.lane}>
                        {r.lane ? <LaneCell lane={r.lane} /> : <Dash />}
                      </TableCell>
                      <TableCell className="max-w-[12rem] truncate" title={r.commodity}>
                        {r.commodity ?? <Dash />}
                      </TableCell>
                      <TableCell className="max-w-[14rem] truncate" title={r.caller}>
                        <CallerCell caller={r.caller} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={statusTone(r.status)} dot={false} className="tabular-nums">
                          {r.status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell numeric>{r.latencyMs}</TableCell>
                      <TableCell numeric className="font-medium">
                        {r.resultTotal != null ? money(r.resultTotal) : <Dash />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* below md : the same ten fields stacked, so a phone never scrolls
                a ten-column table sideways to reach the result. */}
            <Card className="md:hidden">
              <ul>
                {rows.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-col gap-3 border-b border-[var(--c-table-border)] p-4 last:border-b-0"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <ChannelChip channel={r.channel} />
                      <StatusBadge tone={statusTone(r.status)} dot={false} className="tabular-nums">
                        {r.status}
                      </StatusBadge>
                    </div>
                    {/* The endpoint wraps rather than truncates here: it is the
                        line that says what the call actually was. The verb keeps
                        its own field below — an HTTP endpoint already opens with
                        it, so joining the two would print the method twice. */}
                    <p className="font-mono text-caption break-all">{r.endpoint}</p>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                      <Field label="Time">
                        <span className="tabular-nums">
                          {fmtDate(r.at)} {timeOfDay(r.at)} UTC
                        </span>
                      </Field>
                      <Field label="Method">
                        <span className="font-mono text-caption text-muted-foreground">{r.method}</span>
                      </Field>
                      <Field label="Lane">{r.lane ? <LaneCell lane={r.lane} /> : <Dash />}</Field>
                      <Field label="Commodity">{r.commodity ?? <Dash />}</Field>
                      <Field label="Caller">
                        <CallerCell caller={r.caller} />
                      </Field>
                      <Field label="Latency">
                        <span className="tabular-nums">{r.latencyMs} ms</span>
                      </Field>
                      <Field label="Result">
                        {r.resultTotal != null ? (
                          <span className="font-medium tabular-nums">{money(r.resultTotal)}</span>
                        ) : (
                          <Dash />
                        )}
                      </Field>
                    </dl>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}
      </div>
    </AdminGate>
  );
}

function Dash() {
  return <span className="text-muted-foreground">—</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-body text-foreground">{children}</dd>
    </>
  );
}

function ChannelChip({ channel }: { channel: RequestChannel }) {
  const Icon = CHANNEL_ICON[channel];
  return (
    // Two pairs of channels share a tone (manager UI / API, CLI / MCP), so the
    // glyph — the same one the stat card above carries — is what separates them.
    <StatusBadge tone={CHANNEL_TONE[channel]} dot={false} className="font-normal">
      <Icon aria-hidden />
      {CHANNEL_META[channel].label}
    </StatusBadge>
  );
}

function CallerCell({ caller }: { caller: string }) {
  // Anonymous public traffic is what an operator scans this column for: it is
  // the only caller with no account behind it, so it is chipped rather than set
  // in the same muted mono as a named user or a key.
  const anonymous = caller.toLowerCase().includes("anonymous");
  if (!anonymous) return <span className="font-mono text-caption text-muted-foreground">{caller}</span>;
  return (
    <StatusBadge tone="warning" dot={false} className="font-mono font-normal">
      {caller}
    </StatusBadge>
  );
}

/** A lane is one free-text string ("Houston → Alexandria"), so it is split to
    let each end carry its own flag. `laneCountryCode` returns undefined for a
    place it cannot map — a CFS, an inland town, the bare word "port" — and a
    flagless end is the right answer there. */
function LaneCell({ lane }: { lane: string }) {
  const ends = lane.split("→").map((s) => s.trim());
  if (ends.length !== 2) return <>{lane}</>;
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 align-middle">
      <LaneEnd value={ends[0]} />
      <span className="text-muted-foreground">→</span>
      <LaneEnd value={ends[1]} />
    </span>
  );
}

function LaneEnd({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <CountryFlag cc={laneCountryCode(value)} className="text-sm" />
      {value}
    </span>
  );
}
