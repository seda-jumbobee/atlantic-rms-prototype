"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, FlaskConical, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getDevEmails, type DevEmail } from "@/lib/auth/access-store";
import { EmailBody, emailPlainText, EMAIL_TEMPLATE_LABEL } from "@/components/auth/email-templates";
import { fmtDate } from "@/lib/format";

export default function EmailPreviewPage() {
  const [emails, setEmails] = useState<DevEmail[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [plain, setPlain] = useState(false);

  const refresh = () => {
    const list = getDevEmails();
    setEmails(list);
    setSelected((s) => s ?? list[0]?.id ?? null);
  };
  useEffect(refresh, []);

  const current = emails.find((e) => e.id === selected) ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold"><FlaskConical className="size-5 text-primary" /> Email preview</h1>
          <p className="text-sm text-muted-foreground">Transactional emails triggered by the auth flows.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={refresh}><RefreshCw className="size-4" /> Refresh</Button>
          <Button asChild variant="ghost" size="sm" className="gap-1.5"><Link href="/login"><ArrowLeft className="size-4" /> Auth</Link></Button>
        </div>
      </div>

      <Alert>
        <FlaskConical className="size-4" />
        <AlertTitle>Development preview — no email is actually sent</AlertTitle>
        <AlertDescription>
          This project has no email provider configured. Approval, rejection, activation, and reset emails are captured
          here so the flow can be followed. Links below are live — open one to continue the flow.
        </AlertDescription>
      </Alert>

      {emails.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
          <Mail className="size-8 opacity-50" />
          <p className="text-sm">No emails yet. Submit an access request or approve one to generate emails.</p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <div className="space-y-2">
            {emails.map((e) => (
              <button
                key={e.id}
                onClick={() => { setSelected(e.id); setPlain(false); }}
                className={cn(
                  "w-full rounded-lg border p-3 text-left outline-none transition hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  e.id === selected && "border-primary/40 bg-primary/[0.04]",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="text-caption">{EMAIL_TEMPLATE_LABEL[e.template]}</Badge>
                  <span className="text-caption text-muted-foreground">{fmtDate(e.createdAt)}</span>
                </div>
                <div className="mt-1 truncate text-sm font-medium">{e.subject}</div>
                <div className="truncate text-xs text-muted-foreground">To: {e.to}</div>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {current && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-muted-foreground">To: <span className="font-medium text-foreground">{current.to}</span></div>
                  <div className="flex gap-1">
                    <Button variant={plain ? "ghost" : "outline"} size="sm" onClick={() => setPlain(false)}>HTML</Button>
                    <Button variant={plain ? "outline" : "ghost"} size="sm" onClick={() => setPlain(true)}>Plain text</Button>
                  </div>
                </div>
                {plain ? (
                  <pre className="max-w-[560px] overflow-x-auto rounded-xl border bg-muted/40 p-4 text-xs whitespace-pre-wrap">{emailPlainText(current)}</pre>
                ) : (
                  <EmailBody email={current} />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
