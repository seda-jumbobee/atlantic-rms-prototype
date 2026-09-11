import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { QuoteStatus, DealStage } from "@/lib/types";

/**
 * Unified semantic status scale (Figma: "Status badge" node 43:25).
 * Every domain status — quote, deal stage, source, route step, invoice,
 * admin tables — maps into one of these five tones. Never use raw palette
 * colors (amber/emerald/slate/…) for state chips.
 */
/** The five semantic states, plus `brand` — an accent "you are here" chip
 *  for wizard progress, which is not a judgement about the record. */
export type StatusTone = "neutral" | "info" | "positive" | "warning" | "negative" | "brand";

export function StatusBadge({
  tone = "neutral",
  dot = true,
  className,
  children,
  ...props
}: React.ComponentProps<"span"> & { tone?: StatusTone; dot?: boolean }) {
  return (
    <Badge variant={`status-${tone}`} className={cn("gap-[5px]", className)} {...props}>
      {dot && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />}
      {children}
    </Badge>
  );
}

const QUOTE_TONE: Record<QuoteStatus, StatusTone> = {
  draft: "neutral",
  sent: "info",
  confirmed: "positive",
  lost: "negative",
  expired: "warning",
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return <StatusBadge tone={QUOTE_TONE[status]} className="capitalize">{status}</StatusBadge>;
}

const STAGE_TONE: Record<DealStage, StatusTone> = {
  "Incoming Lead": "neutral",
  Qualification: "info",
  "Quote Sent": "info",
  Negotiation: "warning",
  "Confirmed (Won)": "positive",
  Lost: "negative",
};

export function DealStageBadge({ stage }: { stage: DealStage }) {
  return <StatusBadge tone={STAGE_TONE[stage]}>{stage}</StatusBadge>;
}

const SOURCE_TONE: Record<string, StatusTone> = {
  Spot: "info",
  "Carrier Haulage Spot": "info",
  Contract: "positive",
  "Offline Tariff": "neutral",
  "Front Import": "warning",
};

export function SourceBadge({ source }: { source: string }) {
  return <StatusBadge tone={SOURCE_TONE[source] ?? "neutral"} dot={false}>{source}</StatusBadge>;
}
