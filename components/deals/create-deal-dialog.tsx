"use client";

import { useState, type ReactNode } from "react";
import { Plus, Loader2, Check, LinkIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEALS, getCustomer } from "@/lib/data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SyncState = "idle" | "running" | "done";

interface SyncStep {
  system: string;
  detail: string;
}

const SYNC_STEPS: SyncStep[] = [
  { system: "Kommo CRM", detail: "lead #41822" },
  { system: "DemSys", detail: "DS-90417" },
  { system: "QuickBooks", detail: "customer ref QB-3391" },
  { system: "Avalara", detail: "tax profile linked" },
];

export function CreateDealDialog({ trigger }: { trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("link");

  // link-existing tab
  const [leadId, setLeadId] = useState<string>("");

  // create-new tab
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [lane, setLane] = useState("");
  const [commodity, setCommodity] = useState("");

  // staged sync
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [activeStep, setActiveStep] = useState(-1);

  function reset() {
    setSyncState("idle");
    setActiveStep(-1);
    setLeadId("");
    setCompany("");
    setContact("");
    setLane("");
    setCommodity("");
    setTab("link");
  }

  function runSync() {
    setSyncState("running");
    setActiveStep(0);
    SYNC_STEPS.forEach((_, i) => {
      // reveal each step sequentially
      setTimeout(() => setActiveStep(i + 1), (i + 1) * 650);
    });
    setTimeout(() => {
      setSyncState("done");
      toast.success("Deal created & synced (Kommo · DemSys · QuickBooks · Avalara)");
    }, (SYNC_STEPS.length + 1) * 650);
  }

  const canSubmit =
    tab === "link" ? leadId !== "" : company.trim() !== "" && lane.trim() !== "";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setTimeout(reset, 200);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" /> New deal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New deal</DialogTitle>
          <DialogDescription>
            Link an existing CRM lead or create a new deal — it syncs across Kommo, DemSys,
            QuickBooks, and Avalara.
          </DialogDescription>
        </DialogHeader>

        {syncState === "idle" ? (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">
                <LinkIcon className="size-4" /> Link existing lead
              </TabsTrigger>
              <TabsTrigger value="new">
                <Sparkles className="size-4" /> Create new
              </TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="lead">CRM lead</Label>
                <Select value={leadId} onValueChange={setLeadId}>
                  <SelectTrigger id="lead" className="w-full">
                    <SelectValue placeholder="Select a Kommo lead…" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEALS.map((d) => {
                      const customer = getCustomer(d.customerId);
                      return (
                        <SelectItem key={d.id} value={d.id}>
                          <span className="truncate font-mono text-xs">{d.title}</span>
                          {customer && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {customer.company}
                            </span>
                          )}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Pulls the existing lead, contacts, and lane straight from Kommo CRM.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="new" className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Heavy Industries"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact">Contact</Label>
                  <Input
                    id="contact"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lane">Lane</Label>
                <Input
                  id="lane"
                  value={lane}
                  onChange={(e) => setLane(e.target.value)}
                  placeholder="Houston → Poti"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="commodity">Commodity</Label>
                <Input
                  id="commodity"
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  placeholder="Excavator, 24t"
                />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-2 py-2">
            <p className="text-sm font-medium">Syncing connected systems…</p>
            <div className="space-y-1.5">
              {SYNC_STEPS.map((step, i) => {
                const reached = activeStep > i;
                const current = activeStep === i;
                return (
                  <div
                    key={step.system}
                    className={cn(
                      "flex items-center justify-between rounded-md border px-3 py-2 transition-colors",
                      reached ? "bg-success/5 border-success/30" : "bg-muted/30",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      {reached ? (
                        <span className="grid size-5 place-items-center rounded-full bg-success/15">
                          <Check className="size-3.5 text-success" />
                        </span>
                      ) : current ? (
                        <Loader2 className="size-5 animate-spin text-primary" />
                      ) : (
                        <span className="size-5 rounded-full border border-dashed border-muted-foreground/40" />
                      )}
                      <span className="text-sm font-medium">{step.system}</span>
                    </div>
                    <span
                      className={cn(
                        "font-mono text-xs",
                        reached ? "text-success" : "text-muted-foreground",
                      )}
                    >
                      {reached ? step.detail : current ? "connecting…" : "queued"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          {syncState === "done" ? (
            <Button onClick={() => setOpen(false)}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={syncState === "running"}>
                Cancel
              </Button>
              <Button onClick={runSync} disabled={!canSubmit || syncState === "running"}>
                {syncState === "running" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Syncing…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" /> Create &amp; sync
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
