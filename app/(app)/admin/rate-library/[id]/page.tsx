"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { AdminGate } from "@/components/admin-gate";
import { CarrierName } from "@/components/carrier-name";
import { DetailShell, DetailSection, DetailGrid, DetailItem } from "@/components/detail-shell";
import { LocationLabel, LocodeLane } from "@/components/location-label";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  RATE_LIBRARY,
  RATE_TYPE_LABEL,
  findPortByLocode,
  getCarrier,
  getDataSource,
  getVendor,
  type RateRow,
  type RateType,
} from "@/lib/data";
import type { DataSourceKind, DataSourceStatus } from "@/lib/types";
import { fmtDate, money } from "@/lib/format";

/* ============================================================================
   One rate from the library, in full.

   The list answers "which rate"; this page answers "what exactly is this rate,
   and where did it come from" — the amount and how it is charged, the lane it
   prices, who quotes it, how long it stands, and the contract, API or email it
   was imported from.

   THERE IS NO RATE ENDPOINT, and a rate is not authored in RMS in the first
   place: it changes when its source is re-imported or re-synced. So the page
   carries no Edit button that could not work. Its one action opens the data
   source the rate came from, which is a real destination and the place the
   change would actually be made.
   ========================================================================= */

/** The library's fixed demo "today". The list measures validity against this
    same instant, so a rate that reads Expired there reads Expired here. */
const TODAY = new Date("2026-06-23T00:00:00Z").getTime();

/* The rate vocabulary, drawn the same way as on the library list — a rate that
   was "On review" in the table must not become a different word or a different
   colour when it is opened. */
const STATUS_TONE: Record<RateRow["status"], StatusTone> = {
  actual: "positive",
  on_review: "warning",
  old: "neutral",
};
const STATUS_LABEL: Record<RateRow["status"], string> = {
  actual: "Actual",
  on_review: "On review",
  old: "Old",
};

const TYPE_TONE: Record<RateType, StatusTone> = {
  ocean: "info",
  roro: "info",
  trucking: "warning",
  loading: "neutral",
  drayage: "positive",
  surcharge: "negative",
};

/* And the source vocabulary, as the Data Sources screen states it. */
const SOURCE_TONE: Record<DataSourceStatus, StatusTone> = {
  actual: "positive",
  on_review: "warning",
  in_edits: "warning",
  additional: "info",
  old: "neutral",
};
const SOURCE_STATUS_LABEL: Record<DataSourceStatus, string> = {
  actual: "Actual",
  on_review: "On review",
  in_edits: "In edits",
  additional: "Additional",
  old: "Old",
};
const SOURCE_KIND_LABEL: Record<DataSourceKind, string> = {
  shipping_line_api: "Shipping Line API",
  uploaded_contract: "Uploaded Contract",
  custom_request: "Custom-requested Rate",
  front_import: "Front Import",
};

function isExpired(validTo?: string): boolean {
  return !!validTo && new Date(validTo).getTime() < TODAY;
}

/** A missing field. The dash is drawn for the eye; speech hears a word instead
    of "em dash", the way the admin tables state an absent value. */
function NoValue() {
  return (
    <>
      <span aria-hidden className="text-muted-foreground">—</span>
      <span className="sr-only">none</span>
    </>
  );
}

/** One end of the lane. A code that resolves to a port is named in full with
    its country; an end that is not a port — a CFS, a yard — is left as the
    text the library stores, because a flag is only drawn for a country we can
    actually name. */
function LaneEnd({ value }: { value?: string }) {
  if (!value) return <NoValue />;
  const port = findPortByLocode(value);
  if (!port) return <>{value}</>;
  return (
    <LocationLabel
      point={{
        kind: "port",
        name: port.name,
        country: port.country,
        countryCode: port.countryCode,
        code: port.locode,
      }}
    />
  );
}

/** The heading a reader would use to describe this rate out loud: its type,
    then the lane where there is one and the thing being priced where there is
    not. A trucking or surcharge row has no lane, so it is named by commodity. */
function rateTitle(rate: RateRow): string {
  const lane =
    rate.origin && rate.destination
      ? `${rate.origin} → ${rate.destination}`
      : rate.origin ?? rate.destination;
  const subject = lane ?? rate.commodity ?? rate.container;
  return subject ? `${RATE_TYPE_LABEL[rate.type]} · ${subject}` : RATE_TYPE_LABEL[rate.type];
}

export default function RateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const rate = RATE_LIBRARY.find((r) => r.id === id);
  if (!rate) notFound();

  return (
    <AdminGate>
      <RateDetail rate={rate} />
    </AdminGate>
  );
}

function RateDetail({ rate }: { rate: RateRow }) {
  const carrier = getCarrier(rate.carrierId);
  const vendor = getVendor(rate.vendorId);
  const source = getDataSource(rate.dataSourceId);
  const expired = isExpired(rate.validTo);
  const hasLane = !!(rate.origin || rate.destination);
  const counterparty = carrier?.name ?? vendor?.name;

  return (
    <DetailShell
      backHref="/admin/rate-library"
      backLabel="Back to rate library"
      title={rateTitle(rate)}
      status={
        <>
          <StatusBadge tone={STATUS_TONE[rate.status]}>{STATUS_LABEL[rate.status]}</StatusBadge>
          {expired && (
            <StatusBadge tone="warning" dot={false}>
              Expired
            </StatusBadge>
          )}
        </>
      }
      subtitle={
        <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
          {counterparty ?? "No carrier or vendor recorded"}
          <span aria-hidden>·</span>
          <span className="font-mono text-caption">
            <span className="sr-only">Rate ID </span>
            {rate.id}
          </span>
        </span>
      }
      actions={
        source && (
          // The one thing this page can genuinely do: go to where the rate is
          // maintained. `asChild` makes it a real link, so the width rule the
          // shell applies to buttons is restated here for the phone layout.
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/data-sources">
              <ExternalLink className="size-4" /> Open data source
            </Link>
          </Button>
        )
      }
    >
      <DetailSection title="Rate" description="The amount, how it is charged, and what it covers.">
        <DetailGrid>
          <DetailItem label="Amount">
            <span className="text-h3 tabular-nums text-foreground">{money(rate.rate, rate.currency)}</span>
          </DetailItem>
          <DetailItem label="Unit">{rate.unit}</DetailItem>
          <DetailItem label="Currency">{rate.currency}</DetailItem>
          <DetailItem label="Rate type">
            <StatusBadge tone={TYPE_TONE[rate.type]} dot={false}>
              {RATE_TYPE_LABEL[rate.type]}
            </StatusBadge>
          </DetailItem>
          <DetailItem label="Container">{rate.container ?? <NoValue />}</DetailItem>
          <DetailItem label="Commodity">{rate.commodity ?? <NoValue />}</DetailItem>
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Route" description="The lane this rate prices.">
        {hasLane ? (
          <>
            <LocodeLane
              lane={`${rate.origin ?? "—"} → ${rate.destination ?? "—"}`}
              className="text-body-lg font-medium text-foreground"
            />
            {/* Two columns, not the grid's usual three: a port end is a name, a
                country and a code on one line, and the third column is too
                narrow for one before it truncates. */}
            <DetailGrid className="lg:grid-cols-2">
              <DetailItem label="Origin">
                <LaneEnd value={rate.origin} />
              </DetailItem>
              <DetailItem label="Destination">
                <LaneEnd value={rate.destination} />
              </DetailItem>
            </DetailGrid>
          </>
        ) : (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-caption text-muted-foreground">
            No lane is stored on this rate. Trucking, loading and surcharge rates are priced by unit —
            per mile, per row, per container — rather than by port pair.
          </p>
        )}
      </DetailSection>

      <DetailSection title="Carrier / vendor" description="Who quotes this rate.">
        {carrier ? (
          <DetailGrid>
            <DetailItem label="Carrier">
              <CarrierName carrierId={rate.carrierId} />
            </DetailItem>
            <DetailItem label="Carrier code">
              <span className="font-mono">{carrier.code}</span>
            </DetailItem>
          </DetailGrid>
        ) : vendor ? (
          <DetailGrid>
            <DetailItem label="Vendor">
              <Link href={`/admin/vendors/${vendor.id}`} className="text-primary hover:underline">
                {vendor.name}
              </Link>
            </DetailItem>
            <DetailItem label="Based in">{vendor.baseLocation}</DetailItem>
            <DetailItem label="Coast">{vendor.coast}</DetailItem>
          </DetailGrid>
        ) : (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-caption text-muted-foreground">
            No carrier or vendor is recorded on this rate.
          </p>
        )}
      </DetailSection>

      <DetailSection title="Validity" description="How long this rate stands.">
        <DetailGrid>
          <DetailItem label="Valid from">
            {rate.validFrom ? <span className="tabular-nums">{fmtDate(rate.validFrom)}</span> : <NoValue />}
          </DetailItem>
          <DetailItem label="Valid to">
            {rate.validTo ? <span className="tabular-nums">{fmtDate(rate.validTo)}</span> : <NoValue />}
          </DetailItem>
          <DetailItem label="Validity">
            {expired ? (
              <StatusBadge tone="warning" dot={false}>Expired</StatusBadge>
            ) : rate.validTo ? (
              <StatusBadge tone="positive" dot={false}>In validity</StatusBadge>
            ) : (
              <StatusBadge tone="neutral" dot={false}>No end date</StatusBadge>
            )}
          </DetailItem>
        </DetailGrid>
        {expired && (
          // The same thing the library list and the sources screen say about an
          // expired rate: past its dates, but still offered when nothing newer
          // has replaced it.
          <p className="text-caption text-status-warning-fg">
            Past validity — still quotable until the source is refreshed.
          </p>
        )}
      </DetailSection>

      <DetailSection title="Data source" description="Where this rate came into RMS.">
        {source ? (
          <>
            <DetailGrid>
              <DetailItem label="Source">
                <Link href="/admin/data-sources" className="text-primary hover:underline">
                  {source.name}
                </Link>
              </DetailItem>
              <DetailItem label="Kind">{SOURCE_KIND_LABEL[source.kind]}</DetailItem>
              <DetailItem label="Format">{source.format ?? <NoValue />}</DetailItem>
              <DetailItem label="Source status">
                <StatusBadge tone={SOURCE_TONE[source.status]}>
                  {SOURCE_STATUS_LABEL[source.status]}
                </StatusBadge>
              </DetailItem>
              {/* Only a feed syncs. An uploaded contract or a parsed email has
                  no last sync, and an empty field there would read as missing
                  data rather than as a field that does not apply. */}
              {source.lastSync && (
                <DetailItem label="Last sync">
                  <span className="tabular-nums">{fmtDate(source.lastSync)}</span>
                </DetailItem>
              )}
            </DetailGrid>
            {source.description && (
              <p className="text-body text-muted-foreground">{source.description}</p>
            )}
          </>
        ) : (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-caption text-muted-foreground">
            No data source is linked to this rate.
          </p>
        )}
      </DetailSection>

      <p className="text-caption text-muted-foreground">
        A stored rate is not edited in the library — it changes when its source is re-imported or
        re-synced. Nothing on this page writes.
      </p>
    </DetailShell>
  );
}
