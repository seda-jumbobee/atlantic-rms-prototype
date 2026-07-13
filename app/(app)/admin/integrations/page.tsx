"use client";

import { toast } from "sonner";
import {
  Workflow, Ship, Mail, Receipt, Plug, Copy, Terminal, Code2, Boxes, type LucideIcon,
} from "lucide-react";
import { AdminGate } from "@/components/admin-gate";
import { PageHeader } from "@/components/page-header";
import { CarrierLogo } from "@/components/carrier-logo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCarrier } from "@/lib/data";
import { cn } from "@/lib/utils";

type ConnStatus = "connected" | "mock";

function StatusChip({ status }: { status: ConnStatus }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-normal",
        status === "connected" ? "bg-success/15 text-success" : "bg-amber-100 text-amber-700",
      )}
    >
      <span
        className={cn(
          "mr-1.5 inline-block size-1.5 rounded-full",
          status === "connected" ? "bg-success" : "bg-amber-500",
        )}
      />
      {status === "connected" ? "Connected" : "Mock"}
    </Badge>
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

function CodeBlock({
  title,
  icon: Icon,
  code,
}: {
  title: string;
  icon: LucideIcon;
  code: string;
}) {
  const copy = () => {
    navigator.clipboard?.writeText(code).catch(() => {});
    toast.success("Copied to clipboard", { description: title });
  };
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Icon className="size-4 text-muted-foreground" />
          {title}
        </div>
        <Button variant="ghost" size="sm" onClick={copy}>
          <Copy className="size-4" />
          Copy
        </Button>
      </div>
      <pre className="w-full max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-lg border bg-muted p-4 text-xs leading-relaxed text-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <AdminGate>
      <div className="space-y-6">
        <PageHeader
          title="Integrations & API"
          description="The systems RMS talks to, and the single-service surface other tools and agents can build quotes through."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {INTEGRATIONS.map((i) => {
            const Icon = i.icon;
            return (
              <Card key={i.name}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="grid size-10 place-items-center rounded-lg bg-muted text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{i.name}</span>
                      <StatusChip status={i.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">{i.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Plug className="size-5 text-primary" />
              <CardTitle className="text-base">Shipping Line APIs</CardTitle>
            </div>
            <CardDescription>Direct carrier pricing connections feeding the quote engine.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {LINE_CARRIERS.map((id) => {
              const carrier = getCarrier(id);
              return (
                <div key={id} className="flex items-center justify-between rounded-lg border p-3">
                  <CarrierLogo carrierId={id} size="sm" showName />
                  <StatusChip status={carrier?.hasApi ? "connected" : "mock"} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Code2 className="size-5 text-primary" />
              <CardTitle className="text-base">API · CLI · MCP</CardTitle>
            </div>
            <CardDescription>
              One quoting engine, three surfaces — call it over REST, from the CLI, or as an MCP tool from an AI agent.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-3">
            <CodeBlock title="REST" icon={Code2} code={REST_EXAMPLE} />
            <CodeBlock title="CLI" icon={Terminal} code={CLI_EXAMPLE} />
            <CodeBlock title="MCP tool" icon={Boxes} code={MCP_EXAMPLE} />
          </CardContent>
        </Card>
      </div>
    </AdminGate>
  );
}
