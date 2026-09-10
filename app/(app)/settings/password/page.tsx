"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Check } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TextField } from "@/components/ui/field";
import { useSession } from "@/components/session-provider";
import { setPasswordForEmail } from "@/lib/auth/access-store";
import { confirmPasswordError, PASSWORD_HINT, passwordError } from "@/lib/auth/companies";

/* ============================================================================
   Change password — its own route, not a modal or an inline panel.

   The store's contract is setPasswordForEmail(email, password): it changes the
   credential for an already-authenticated account and does NOT take the
   current password, so no current-password field is shown. A real backend
   that required re-authentication would need one added here — see the summary.

   Validation reuses lib/auth/companies (the same rules the activation and
   reset screens enforce); the password inputs are the shared TextField, which
   already carries the show/hide toggle and the aria wiring.
   ========================================================================= */

export default function ChangePasswordPage() {
  const { user } = useSession();
  const router = useRouter();

  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [confirmErr, setConfirmErr] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!user) return null;

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (busy || !user) return;

    const pe = passwordError(pw, user.email);
    const ce = confirmPasswordError(pw, confirm);
    setPwErr(pe);
    setConfirmErr(ce);
    setFormErr(null);
    if (pe || ce) return;

    setBusy(true);
    try {
      const res = await setPasswordForEmail(user.email, pw);
      if (!res.ok) {
        // The write genuinely failed — say so rather than showing success.
        setFormErr(
          res.reason === "no-account"
            ? "Your session has expired. Please log in again."
            : "We couldn’t change your password. Please try again."
        );
        if (res.reason === "no-account") {
          setTimeout(() => router.replace("/login"), 1600);
        }
        return;
      }
      // The values are dropped the moment they are no longer needed; nothing
      // is logged, echoed into an error, or written anywhere but the hash.
      setPw("");
      setConfirm("");
      setDone(true);
    } catch {
      setFormErr("We couldn’t change your password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const backLink = (
    <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
      <Link href="/settings">
        <ArrowLeft aria-hidden className="size-4" /> Back to settings
      </Link>
    </Button>
  );

  /* ── success ───────────────────────────────────────────────────────────── */
  if (done) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        {backLink}
        <Card className="items-center gap-5 p-8 text-center">
          <div aria-hidden className="grid size-16 place-items-center rounded-full bg-success">
            <Check className="size-8 text-success-foreground" strokeWidth={3} />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-h3 text-foreground">Password updated</h1>
            <p className="text-body text-muted-foreground">
              You can now continue using your Atlantic RMS account.
            </p>
          </div>
          {/* The session is deliberately left intact: nothing in this
              architecture invalidates it on a password change. */}
          <Button asChild>
            <Link href="/settings">Back to settings</Link>
          </Button>
        </Card>
      </div>
    );
  }

  /* ── form ──────────────────────────────────────────────────────────────── */
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      {backLink}

      <div className="flex flex-col gap-1">
        <h1 className="text-h3 text-foreground">Change password</h1>
        <p className="text-body text-muted-foreground">
          Create a new password for your Atlantic RMS account.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          {formErr && (
            <Alert variant="destructive" role="alert">
              <AlertCircle aria-hidden />
              <AlertDescription>{formErr}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-5">
            <TextField
              label="New password"
              type="password"
              required
              autoComplete="new-password"
              autoFocus
              placeholder="Enter a new password"
              helper={PASSWORD_HINT}
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                if (pwErr) setPwErr(passwordError(e.target.value, user!.email));
                if (confirmErr) setConfirmErr(confirmPasswordError(e.target.value, confirm));
              }}
              onBlur={() => setPwErr(passwordError(pw, user!.email))}
              error={pwErr ?? undefined}
            />
            <TextField
              label="Confirm new password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Re-enter the new password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (confirmErr) setConfirmErr(confirmPasswordError(pw, e.target.value));
              }}
              onBlur={() => setConfirmErr(confirmPasswordError(pw, confirm))}
              error={confirmErr ?? undefined}
            />
          </div>

          <Button type="submit" loading={busy} loadingText="Changing password…" className="self-start">
            Change password
          </Button>
        </form>
      </Card>
    </div>
  );
}
