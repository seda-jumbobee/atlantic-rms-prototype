"use client";

import { toast } from "sonner";
import {
  Workflow, Ship, Mail, Receipt, Plug, Copy, Terminal, Code2, Boxes, type LucideIcon,
} from "lucide-react";
import { AdminGate } from "@/components/admin-gate";
import { PageHeader } from "@/components/page-header";
import { CarrierName } from "@/components/carrier-name";
import { AccentTile, accentAt } from "@/components/accent-tile";
import { IconTile } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { getCarrier } from "@/lib/data";
import { cn } from "@/lib/utils";

type ConnStatus = "connected" | "mock";

function StatusChip({ status }: { status: ConnStatus }) {
  return (
    <StatusBadge tone={status === "connected" ? "positive" : "warning"}>
      {status === "connected" ? "Connected" : "Mock"}
    </StatusBadge>
  );
}

const INTEGRATIONS: {
  name: string;
  icon: LucideIcon;
  status: ConnStatus;
  desc: string;
}[] = [
  { name: "Kommo CRM", icon: Workflow, status: "connected", desc: "Two-way deal & pipeline sync — leads, stages and quotes flow between Kommo and RMS." },
  { name: "DemSys", icon: Ship, status: "connected", desc: "Operations / shipment management — a deal is pushed to DemSys automatically on win." },
  { name: "Front", icon: Mail, status: "connected", desc: "Shared email inbox + rate import — vendor replies are parsed into the rate-review queue." },
  { name: "QuickBooks", icon: Receipt, status: "mock", desc: "Invoice & payment reconciliation — matches vendor invoices against quoted expenses." },
];

const LINE_CARRIERS = ["c-maersk", "c-msc", "c-cma", "c-zim"];

const REST_EXAMPLE = `GET /api/v1/quotes?origin=USHOU&destination=EGALY&commodity=forklift
Authorization: Bearer $RMS_API_KEY

200 OK
{
  "options": [
    { "carrier": "MAERSK", "shipmentType": "Container", "total": 4820, "transitDays": 28 },
    { "carrier": "MSC",    "shipmentType": "Container", "total": 4610, "transitDays": 31 }
  ]
}`;

const CLI_EXAMPLE = `$ rms quote create \\
    --origin USHOU \\
    --dest EGALY \\
    --equipment hyster-h50

✓ Built 4 rate options · best $4,610 (MSC, 31d)
  quote saved → Q-190612`;

const MCP_EXAMPLE = `// MCP tool exposed to AI agents
{
  "tool": "rms.build_quote",
  "arguments": {
    "origin": "USHOU",
    "destination": "EGALY",
    "commodity": "forklift"
  }
}`;

/** A card section: glyph tile, heading, one line of context. The heading is a
    real <h2> at text-h4, as on the refined pages, so this page's three blocks
    read as one outline rather than three styled divs. */
function SectionCard({
  id, title, description, icon: Icon, children,
}: {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Card asChild>
      <section aria-labelledby={id}>
        <CardHeader className="gap-1.5">
          <div className="flex items-center gap-2.5">
            <IconTile size="sm" className="text-primary">
              <Icon />
            </IconTile>
            <h2 id={id} className="text-h4 text-foreground">{title}</h2>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {children}
      </section>
    </Card>
  );
}

function CodeBlock({
  title,
  icon: Icon,
  code,
  className,
}: {
  title: string;
  icon: LucideIcon;
  code: string;
  className?: string;
}) {
  // The clipboard is unavailable in an insecure context and can be refused by
  // the user, so the confirmation waits on the write instead of assuming it.
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Copied to clipboard", { description: title });
    } catch {
      toast.error("Could not copy", { description: "Select the snippet and copy it manually." });
    }
  };
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-body font-medium text-foreground">
          <Icon aria-hidden className="size-4 text-muted-foreground" />
          {title}
        </h3>
        {/* Three buttons on the page read "Copy": the label names the snippet
            for anyone who cannot see which column they are in. 32px is a
            desktop-density control, and on a phone this is the page's only
            control — so it takes the full 44px target there. */}
        <Button
          variant="ghost"
          size="sm"
          className="px-2 max-sm:h-11"
          onClick={copy}
          aria-label={`Copy ${title} example`}
        >
          <Copy className="size-4" />
          Copy
        </Button>
      </div>
      {/* flex-1 so the three panes end level; wrapping rather than scrolling
          keeps a 68-character request line inside a 375px viewport. */}
      <pre className="w-full max-w-full flex-1 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-[var(--c-card-border)] bg-muted p-3 font-mono text-caption leading-relaxed text-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <AdminGate>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Integrations & API"
          description="The systems RMS talks to, and the single-service surface other tools and agents can build quotes through."
        />

        <section aria-labelledby="business-systems-heading" className="flex flex-col gap-3">
          <h2 id="business-systems-heading" className="text-h4 text-foreground">Business systems</h2>
          {/* Two columns at most: at four the descriptions run to six lines and
              the grid stops being scannable. */}
          <div className="grid gap-3 sm:grid-cols-2">
            {INTEGRATIONS.map((i, idx) => {
              const Icon = i.icon;
              return (
                <Card key={i.name} className="gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <AccentTile accent={accentAt(idx)}>
                      <Icon aria-hidden className="size-5" />
                    </AccentTile>
                    <StatusChip status={i.status} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-body font-medium text-foreground">{i.name}</h3>
                    <p className="text-body leading-relaxed text-muted-foreground">{i.desc}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <SectionCard
          id="shipping-line-apis-heading"
          title="Shipping Line APIs"
          description="Direct carrier pricing connections feeding the quote engine."
          icon={Plug}
        >
          {/* Two-up only from lg: with the sidebar out, half a tablet row
              leaves ~90px for the name and "Mediterranean Shipping Co."
              truncates to "Medite…". */}
          <CardContent className="grid gap-2 lg:grid-cols-2">
            {LINE_CARRIERS.map((id) => {
              const carrier = getCarrier(id);
              return (
                <div
                  key={id}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-[var(--c-card-border)] px-3 py-2"
                >
                  <CarrierName carrierId={id} />
                  <StatusChip status={carrier?.hasApi ? "connected" : "mock"} />
                </div>
              );
            })}
          </CardContent>
        </SectionCard>

        <SectionCard
          id="api-surfaces-heading"
          title="API · CLI · MCP"
          description="One quoting engine, three surfaces — call it over REST, from the CLI, or as an MCP tool from an AI agent."
          icon={Code2}
        >
          {/* REST takes the full row: its request line is 68 characters and a
              third of the row is ~46, so in three equal columns the URL broke
              mid-token. CLI and MCP are short enough to sit side by side. */}
          <CardContent className="grid gap-5 lg:grid-cols-2">
            <CodeBlock title="REST" icon={Code2} code={REST_EXAMPLE} className="lg:col-span-2" />
            <CodeBlock title="CLI" icon={Terminal} code={CLI_EXAMPLE} />
            <CodeBlock title="MCP tool" icon={Boxes} code={MCP_EXAMPLE} />
          </CardContent>
        </SectionCard>
      </div>
    </AdminGate>
  );
}
