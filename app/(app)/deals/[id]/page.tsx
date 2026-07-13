"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Lock, Calendar, Ship, Package, FileText, DollarSign,
  Link2, CheckCircle2, Circle, Workflow, ClipboardList, Truck, Anchor,
  Clock, ChevronRight, Camera, ImageIcon,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DealStageBadge } from "@/components/status-badge";
import { ManagerAvatar } from "@/components/deals/manager-avatar";
import { InvoiceComparison } from "@/components/deals/invoice-comparison";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useIsAdmin } from "@/components/session-provider";
import { getDeal, getCustomer, getUser } from "@/lib/data";
import { money, fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Deal } from "@/lib/types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function laneOf(d: Deal): string {
  const parts = [d.origin, d.pol, d.pod, d.destination].filter(Boolean);
  return parts.length ? parts.join(" → ") : "—";
}

function Economics({ deal }: { deal: Deal }) {
  const isAdmin = useIsAdmin();
  const sale = deal.sale ?? 0;
  const expenses = deal.expenses ?? 0;
  const gp = deal.grossProfit ?? (deal.sale != null && deal.expenses != null ? sale - expenses : undefined);
  const marginPct = sale > 0 && gp != null ? Math.round((gp / sale) * 100) : undefined;
  const commission = deal.commissionPct != null && gp != null ? (gp * deal.commissionPct) / 100 : undefined;
  const expPct = sale > 0 ? Math.min(100, Math.round((expenses / sale) * 100)) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="size-4 text-primary" /> Economics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Sale">
          <span className="text-xl font-semibold tabular-nums">{money(sale)}</span>
        </Field>

        {isAdmin ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Expenses (cost)">
                <span className="tabular-nums">{money(expenses)}</span>
              </Field>
              <Field label="Gross profit">
                <span className="font-medium tabular-nums text-success">
                  {gp != null ? money(gp) : "—"}
                </span>
              </Field>
              <Field label="Margin">
                <span className="tabular-nums">{marginPct != null ? `${marginPct}%` : "—"}</span>
              </Field>
              <Field label="Commission">
                <span className="tabular-nums">
                  {deal.commissionPct != null ? `${deal.commissionPct}%` : "—"}
                  {commission != null && ` · ${money(commission)}`}
                </span>
              </Field>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Cost vs sale</span>
                <span className="tabular-nums">{expPct}% cost</span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                <div className="bg-destructive/70" style={{ width: `${expPct}%` }} />
                <div className="bg-success/70" style={{ width: `${100 - expPct}%` }} />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Expenses {money(expenses)}</span>
                <span>Profit {gp != null ? money(gp) : "—"}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" /> Cost &amp; margin visible to Procurement only.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function IntegrationChip({
  label, value, connected,
}: { label: string; value?: string; connected: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2",
        connected ? "border-success/40 bg-success/5" : "bg-muted/40",
      )}
    >
      {connected ? (
        <CheckCircle2 className="size-4 text-success" />
      ) : (
        <Circle className="size-4 text-muted-foreground" />
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium">{label}</p>
        <p className="truncate font-mono text-[11px] text-muted-foreground">{value ?? "Not linked"}</p>
      </div>
    </div>
  );
}

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const deal = getDeal(id);
  if (!deal) notFound();

  const customer = getCustomer(deal.customerId);
  const manager = getUser(deal.managerId);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Link href="/deals" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to deals
      </Link>

      <PageHeader title="Deal detail" description={`${deal.pipeline} · ${deal.commodityType}`}>
        <DealStageBadge stage={deal.stage} />
      </PageHeader>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="break-words font-mono text-sm font-medium">{deal.title}</p>
          <Separator />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <Field label="Customer">
              <span className="font-medium">{customer?.company ?? "—"}</span>
              {customer?.contact && (
                <p className="text-xs text-muted-foreground">
                  {customer.contact}
                  {customer.email && ` · ${customer.email}`}
                </p>
              )}
            </Field>
            <Field label="Manager">
              <ManagerAvatar user={manager} showName />
            </Field>
            <Field label="Lead source">{deal.leadSource}</Field>
            <Field label="Lane">
              <span className="inline-flex items-center gap-1.5">
                <Ship className="size-3.5 text-muted-foreground" />
                <span className="text-xs">{laneOf(deal)}</span>
              </span>
            </Field>
            <Field label="Shipping type">
              <span className="inline-flex items-center gap-1.5">
                <Package className="size-3.5 text-muted-foreground" />
                {deal.shippingType ?? "—"}
              </span>
            </Field>
            <Field label="Quote">
              {deal.quoteId ? (
                <Link href="/quote-master" className="inline-flex items-center gap-1 text-primary hover:underline">
                  <FileText className="size-3.5" /> {deal.quoteId}
                </Link>
              ) : (
                "—"
              )}
            </Field>
            <Field label="Created">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground" />
                {fmtDate(deal.createdAt)}
              </span>
            </Field>
            <Field label="Last modified">{fmtDate(deal.lastModified)}</Field>
            {deal.closedAt && <Field label="Closed">{fmtDate(deal.closedAt)}</Field>}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Economics deal={deal} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="size-4 text-primary" /> Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <IntegrationChip label="Kommo CRM" value={deal.id} connected />
            <IntegrationChip label="DemSys" value={deal.demsysNo} connected={!!deal.demsysNo} />
            <IntegrationChip label="Booking" value={deal.bookingNo} connected={!!deal.bookingNo} />
            <IntegrationChip label="Reference" value={deal.referenceNo} connected={!!deal.referenceNo} />
          </CardContent>
        </Card>
      </div>

      <FinanceSection dealId={deal.id} />

      <OperationsSection deal={deal} />
    </div>
  );
}

const HANDOFF_STAGES = [
  { key: "RMS", sub: "Quote" },
  { key: "Kommo CRM", sub: "Deal" },
  { key: "DemSys", sub: "Operations" },
  { key: "QuickBooks", sub: "Payment" },
] as const;

function requiredServices(deal: Deal): string[] {
  const ship = (deal.shippingType ?? "").toLowerCase();
  const dest = `${deal.destination ?? ""} ${deal.pod ?? ""}`.toLowerCase();
  const services = ["Export declaration (DemSys)", "Cargo securing & lashing"];

  if (ship.includes("flat rack") || ship.includes("40fr") || ship.includes("fr")) {
    services.push("NCB loading inspection (Hapag/Maersk only)");
  }
  if (dest.includes("australia") || dest.includes("melbourne")) {
    services.push("Fumigation / ISPM-15");
  }
  if (dest.includes("egypt") || dest.includes("alexandria")) {
    services.push("ACID filing");
  }
  if (
    dest.includes("germany") || dest.includes("italy") ||
    dest.includes("belgium") || dest.includes("netherlands")
  ) {
    services.push("EORI");
  }
  return services;
}

const OPS_STEPS = [
  { label: "Pickup booked", icon: ClipboardList },
  { label: "Trucking", icon: Truck },
  { label: "Terminal loading (max 3 days, else storage)", icon: Package },
  { label: "NCB inspection", icon: CheckCircle2 },
  { label: "Loaded on vessel", icon: Anchor },
  { label: "Sailed", icon: Ship },
] as const;

// How many ops steps are complete, derived from the deal stage.
function completedSteps(deal: Deal): number {
  switch (deal.stage) {
    case "Confirmed (Won)":
      return OPS_STEPS.length; // operations underway / sailed
    case "Negotiation":
      return 2;
    case "Quote Sent":
      return 1;
    default: // Incoming Lead, Qualification, Lost
      return 0;
  }
}

function OperationsSection({ deal }: { deal: Deal }) {
  const services = requiredServices(deal);
  const done = completedSteps(deal);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Workflow className="size-4 text-primary" /> Operations &amp; handoff
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Lifecycle stage: quote → deal → operations → payment. Operations is handled in DemSys.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Handoff flow */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          {HANDOFF_STAGES.map((s, i) => {
            const value =
              s.key === "RMS" ? deal.quoteId
              : s.key === "Kommo CRM" ? deal.id
              : s.key === "DemSys" ? deal.demsysNo
              : (deal.referenceNo ?? deal.bookingNo);
            const connected = !!value;
            return (
              <div key={s.key} className="flex flex-1 items-center gap-2">
                <div
                  className={cn(
                    "flex flex-1 items-center gap-2 rounded-lg border px-3 py-2",
                    connected ? "border-success/40 bg-success/5" : "bg-muted/40",
                  )}
                >
                  {connected ? (
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{s.key}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {value ?? s.sub}
                    </p>
                  </div>
                </div>
                {i < HANDOFF_STAGES.length - 1 && (
                  <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
                )}
              </div>
            );
          })}
        </div>

        <Separator />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Required services checklist */}
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <ClipboardList className="size-4 text-muted-foreground" /> Required operational services
            </p>
            <ul className="space-y-1.5">
              {services.map((svc) => (
                <li key={svc} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>{svc}</span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-muted-foreground">
              Derived from shipping type &amp; destination — carried automatically into DemSys.
            </p>
          </div>

          {/* Ops timeline / stepper */}
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Ship className="size-4 text-muted-foreground" /> Operations status
            </p>
            <ol className="space-y-1.5">
              {OPS_STEPS.map((step, i) => {
                const isDone = i < done;
                const isCurrent = i === done;
                const Icon = isDone ? CheckCircle2 : isCurrent ? Clock : Circle;
                return (
                  <li
                    key={step.label}
                    className={cn(
                      "flex items-start gap-2 text-sm",
                      isDone ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        isDone ? "text-success" : isCurrent ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    <span>{step.label}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <Separator />

        {/* Driver photos placeholder */}
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Camera className="size-4 text-muted-foreground" /> Driver photos (Movauto)
          </p>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex size-20 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground"
              >
                <ImageIcon className="size-5" />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">Auto-synced to DemSys.</p>
        </div>

        <div className="rounded-lg border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
          Replaces the manual Word &ldquo;instructions doc&rdquo;: RMS → CRM → DemSys now carries
          origin / POL / POD / destination, services &amp; prices automatically.
        </div>
      </CardContent>
    </Card>
  );
}

function FinanceSection({ dealId }: { dealId: string }) {
  const isAdmin = useIsAdmin();
  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="size-4 text-muted-foreground" /> Invoice reconciliation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" /> Vendor invoice comparison is visible to Procurement only.
          </div>
        </CardContent>
      </Card>
    );
  }
  return <InvoiceComparison dealId={dealId} />;
}
