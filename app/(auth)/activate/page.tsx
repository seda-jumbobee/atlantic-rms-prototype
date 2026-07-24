"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthShell, PasswordField } from "@/components/auth/auth-shell";
import { PASSWORD_HINT, passwordError, companyById, expiryLabel, ACTIVATION_TOKEN_TTL_HOURS } from "@/lib/auth/companies";
import { validateActivation, activateAccount, resendActivation, type LinkState } from "@/lib/auth/access-store";

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate font-medium">{value}</span>
    </div>
  );
}

function ActivateInner() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [{ state, email, company }, setLink] = useState<{ state: LinkState | "loading"; email?: string; company?: string }>({ state: "loading" });

  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [confirmErr, setConfirmErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const res = validateActivation(token);
    const req = res.request;
    setLink({ state: res.state, email: req?.email, company: req ? companyById(req.companyId)?.name : undefined });
  }, [token]);

  const confirmError = useMemo(
    () => (v: string, base = pw) => (!v ? "Confirm your password." : v !== base ? "Passwords do not match." : null),
    [pw],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const pe = passwordError(pw);
    const ce = confirmError(confirm);
    setPwErr(pe); setConfirmErr(ce); setServerErr(null);
    if (pe) return document.getElementById("new-password")?.focus();
    if (ce) return document.getElementById("confirm-password")?.focus();
    setSubmitting(true);
    window.setTimeout(() => {
      try {
        const res = activateAccount(token);
        if (res.ok) setDone(true);
        else { const rv = validateActivation(token); setLink((l) => ({ ...l, state: rv.state })); }
      } catch {
        setServerErr("We couldn’t create your account. Your password was not saved. Try again.");
      } finally {
        setSubmitting(false);
      }
    }, 500);
  };

  if (done) {
    return (
      <AuthShell
        icon={<div className="grid size-12 place-items-center rounded-full bg-success/10 text-success"><CheckCircle2 className="size-6" /></div>}
        title="Account created"
        description="Your Atlantic RMS account is ready."
        footer={<Link href="/login" className="font-medium text-primary hover:underline">Back to log in</Link>}
      >
        {/* No secure session can be created for a prototype-activated account without a
            backend, so we send the user to log in rather than fake a session identity. */}
        <Button className="w-full" onClick={() => router.push("/login")}>Log in</Button>
      </AuthShell>
    );
  }

  if (state === "loading") {
    return <AuthShell title="Checking your setup link…" description="One moment."><div className="h-8" aria-live="polite" /></AuthShell>;
  }

  if (state === "expired") {
    return (
      <AuthShell icon={<StateIcon tone="warning"><Clock className="size-6" /></StateIcon>} title="This setup link has expired" description="Request a new email to finish setting up your account.">
        <div className="space-y-2">
          <Button className="w-full" disabled={resent} onClick={() => { if (email) resendActivation(email); setResent(true); }}>
            {resent ? "New setup email sent" : "Send a new setup email"}
          </Button>
          <Button asChild variant="outline" className="w-full"><Link href="/login">Back to log in</Link></Button>
        </div>
      </AuthShell>
    );
  }
  if (state === "used") {
    return (
      <AuthShell icon={<StateIcon tone="info"><CheckCircle2 className="size-6" /></StateIcon>} title="This setup link has already been used" description="Your account may already be active. Try logging in or reset your password.">
        <div className="space-y-2">
          <Button asChild className="w-full"><Link href="/login">Log in</Link></Button>
          <Button asChild variant="outline" className="w-full"><Link href="/forgot-password">Reset password</Link></Button>
        </div>
      </AuthShell>
    );
  }
  if (state === "invalid") {
    return (
      <AuthShell icon={<StateIcon tone="warning"><Link2Off className="size-6" /></StateIcon>} title="This setup link is invalid" description="The link may be incomplete or no longer available.">
        <div className="space-y-2">
          <Button asChild className="w-full"><Link href="/request-access">Request a new setup email</Link></Button>
          <Button asChild variant="outline" className="w-full"><Link href="/login">Back to log in</Link></Button>
        </div>
      </AuthShell>
    );
  }
  if (state === "unavailable") {
    return (
      <AuthShell icon={<StateIcon tone="warning"><AlertCircle className="size-6" /></StateIcon>} title="Account setup is unavailable" description="Contact your administrator for help.">
        <Button asChild variant="outline" className="w-full"><Link href="/login">Back to log in</Link></Button>
      </AuthShell>
    );
  }

  // valid → create-password form
  return (
    <AuthShell title="Create your password" description="Your access has been approved. Create a password to finish setting up your account.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {serverErr && <Alert variant="destructive" aria-live="polite"><AlertCircle className="size-4" /><AlertDescription>{serverErr}</AlertDescription></Alert>}
        <div className="space-y-2">
          {email && <ReadOnlyRow label="Corporate email" value={email} />}
          {company && <ReadOnlyRow label="Company" value={company} />}
        </div>
        <PasswordField
          id="new-password" label="New password" required autoComplete="new-password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); if (pwErr) setPwErr(passwordError(e.target.value)); if (confirm) setConfirmErr(confirmError(confirm, e.target.value)); }}
          onBlur={() => setPwErr(passwordError(pw))}
          error={pwErr}
          hint={PASSWORD_HINT}
        />
        <PasswordField
          id="confirm-password" label="Confirm password" required autoComplete="new-password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setConfirmErr(confirmError(e.target.value)); }}
          onBlur={() => setConfirmErr(confirmError(confirm))}
          error={confirmErr}
        />
        <Button type="submit" className="w-full" disabled={submitting} aria-busy={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-caption text-muted-foreground">This link expires in {expiryLabel(ACTIVATION_TOKEN_TTL_HOURS)} and can be used once.</p>
      </form>
    </AuthShell>
  );
}

function StateIcon({ tone, children }: { tone: "warning" | "info"; children: React.ReactNode }) {
  const cls = tone === "warning" ? "bg-status-warning-bg text-status-warning-fg" : "bg-status-info-bg text-status-info-fg";
  return <div className={`grid size-12 place-items-center rounded-full ${cls}`}>{children}</div>;
}

export default function ActivatePage() {
  return (
    <Suspense fallback={<AuthShell title="Loading…" description=""><div className="h-8" /></AuthShell>}>
      <ActivateInner />
    </Suspense>
  );
}
