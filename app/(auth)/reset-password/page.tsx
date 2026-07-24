"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthShell, PasswordField } from "@/components/auth/auth-shell";
import { PASSWORD_HINT, passwordError, expiryLabel, RESET_TOKEN_TTL_HOURS } from "@/lib/auth/companies";
import { validateReset, completeReset, type LinkState } from "@/lib/auth/access-store";

function StateIcon({ tone, children }: { tone: "warning" | "info"; children: React.ReactNode }) {
  const cls = tone === "warning" ? "bg-status-warning-bg text-status-warning-fg" : "bg-status-info-bg text-status-info-fg";
  return <div className={`grid size-12 place-items-center rounded-full ${cls}`}>{children}</div>;
}

function ResetInner() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<LinkState | "loading">("loading");

  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [confirmErr, setConfirmErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => { setState(validateReset(token).state); }, [token]);

  const confirmError = useMemo(
    () => (v: string, base = pw) => (!v ? "Confirm your password." : v !== base ? "Passwords do not match." : null),
    [pw],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const pe = passwordError(pw);
    const ce = confirmError(confirm);
    setPwErr(pe); setConfirmErr(ce); setServerErr(null);
    if (pe) return document.getElementById("rp-new")?.focus();
    if (ce) return document.getElementById("rp-confirm")?.focus();
    setSubmitting(true);
    window.setTimeout(() => {
      try {
        const res = completeReset(token);
        if (res.ok) setDone(true);
        else setState(validateReset(token).state);
      } catch {
        setServerErr("We couldn’t update your password. It was not saved. Try again.");
      } finally {
        setSubmitting(false);
      }
    }, 500);
  };

  if (done) {
    return (
      <AuthShell
        icon={<div className="grid size-12 place-items-center rounded-full bg-success/10 text-success"><CheckCircle2 className="size-6" /></div>}
        title="Password updated"
        description="You can now log in with your new password."
        footer={null}
      >
        <Button asChild className="w-full"><Link href="/login">Log in</Link></Button>
      </AuthShell>
    );
  }

  if (state === "loading") {
    return <AuthShell title="Checking your reset link…" description="One moment."><div className="h-8" aria-live="polite" /></AuthShell>;
  }
  if (state === "expired") {
    return (
      <AuthShell icon={<StateIcon tone="warning"><Clock className="size-6" /></StateIcon>} title="This reset link has expired" description="Request a new password-reset link.">
        <div className="space-y-2">
          <Button asChild className="w-full"><Link href="/forgot-password">Request a new link</Link></Button>
          <Button asChild variant="outline" className="w-full"><Link href="/login">Back to log in</Link></Button>
        </div>
      </AuthShell>
    );
  }
  if (state === "used") {
    return (
      <AuthShell icon={<StateIcon tone="info"><CheckCircle2 className="size-6" /></StateIcon>} title="This reset link has already been used" description="Your password may already be updated. Try logging in or request a new link.">
        <div className="space-y-2">
          <Button asChild className="w-full"><Link href="/login">Log in</Link></Button>
          <Button asChild variant="outline" className="w-full"><Link href="/forgot-password">Reset password</Link></Button>
        </div>
      </AuthShell>
    );
  }
  if (state === "invalid") {
    return (
      <AuthShell icon={<StateIcon tone="warning"><Link2Off className="size-6" /></StateIcon>} title="This reset link is invalid" description="The link may be incomplete or no longer available.">
        <div className="space-y-2">
          <Button asChild className="w-full"><Link href="/forgot-password">Request a new link</Link></Button>
          <Button asChild variant="outline" className="w-full"><Link href="/login">Back to log in</Link></Button>
        </div>
      </AuthShell>
    );
  }

  // valid
  return (
    <AuthShell title="Create a new password" description="Choose a new password for your Atlantic RMS account.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {serverErr && <Alert variant="destructive" aria-live="polite"><AlertCircle className="size-4" /><AlertDescription>{serverErr}</AlertDescription></Alert>}
        <PasswordField
          id="rp-new" label="New password" required autoComplete="new-password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); if (pwErr) setPwErr(passwordError(e.target.value)); if (confirm) setConfirmErr(confirmError(confirm, e.target.value)); }}
          onBlur={() => setPwErr(passwordError(pw))}
          error={pwErr}
          hint={PASSWORD_HINT}
        />
        <PasswordField
          id="rp-confirm" label="Confirm password" required autoComplete="new-password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setConfirmErr(confirmError(e.target.value)); }}
          onBlur={() => setConfirmErr(confirmError(confirm))}
          error={confirmErr}
        />
        <Button type="submit" className="w-full" disabled={submitting} aria-busy={submitting}>
          {submitting ? "Updating password…" : "Update password"}
        </Button>
        <p className="text-caption text-muted-foreground">This link expires in {expiryLabel(RESET_TOKEN_TTL_HOURS)} and can be used once.</p>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthShell title="Loading…" description=""><div className="h-8" /></AuthShell>}>
      <ResetInner />
    </Suspense>
  );
}
