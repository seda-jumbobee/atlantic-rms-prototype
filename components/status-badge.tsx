import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { QuoteStatus, DealStage } from "@/lib/types";

const QUOTE_STYLE: Record<QuoteStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-700",
  confirmed: "bg-success/15 text-success",
  lost: "bg-destructive/10 text-destructive",
  expired: "bg-amber-100 text-amber-700",
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return <Badge variant="secondary" className={cn("capitalize", QUOTE_STYLE[status])}>{status}</Badge>;
}

const STAGE_STYLE: Record<DealStage, string> = {
  "Incoming Lead": "bg-slate-100 text-slate-700",
  Qualification: "bg-indigo-100 text-indigo-700",
  "Quote Sent": "bg-blue-100 text-blue-700",
  Negotiation: "bg-amber-100 text-amber-700",
  "Confirmed (Won)": "bg-success/15 text-success",
  Lost: "bg-destructive/10 text-destructive",
};

export function DealStageBadge({ stage }: { stage: DealStage }) {
  return <Badge variant="secondary" className={cn(STAGE_STYLE[stage])}>{stage}</Badge>;
}

const SOURCE_STYLE: Record<string, string> = {
  Spot: "bg-violet-100 text-violet-700",
  "Carrier Haulage Spot": "bg-fuchsia-100 text-fuchsia-700",
  Contract: "bg-emerald-100 text-emerald-700",
  "Offline Tariff": "bg-slate-100 text-slate-700",
  "Front Import": "bg-orange-100 text-orange-700",
};

export function SourceBadge({ source }: { source: string }) {
  return <Badge variant="secondary" className={cn("font-normal", SOURCE_STYLE[source] ?? "bg-muted text-muted-foreground")}>{source}</Badge>;
}
