"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TextField } from "@/components/ui/field";
import { useSession } from "@/components/session-provider";
import { setPasswordForEmail } from "@/lib/auth/access-store";
import { confirmPasswordError, PASSWORD_HINT, passwordError } from "@/lib/auth/companies";

/* ============================================================================
   Change password — rendered inline in Settings › Security.

   The store's contract is setPasswordForEmail(email, password): it changes
   the credential for an already-authenticated account and does NOT take the
   current password, so no current-password field is shown. A real backend
   requiring re-authentication would need one added here.

   Validation reuses lib/auth/companies — the same rules the activation and
   reset screens enforce — and the fields are the shared TextField, which
   already carries the show/hide toggle and the aria wiring.

   Nothing here logs, echoes or stores a password: the values are dropped the
   moment the hash is written.
   ========================================================================= */

export function ChangePasswordForm() {
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
    setDone(false);
    if (pe || ce) return;

    setBusy(true);
    try {
      const res = await setPasswordForEmail(user.email, pw);
      if (!res.ok) {
        // The write genuinely failed — never report success for it.
        setFormErr(
          res.reason === "no-account"
            ? "Your session has expired. Please log in again."
            : "We couldn’t change your password. Please try again."
        );
        if (res.reason === "no-account") setTimeout(() => router.replace("/login"), 1600);
        return;
      }
      setPw("");
      setConfirm("");
      setDone(true);
    } catch {
      setFormErr("We couldn’t change your password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {formErr && (
        <Alert variant="destructive" role="alert">
          <AlertCircle aria-hidden />
          <AlertDescription>{formErr}</AlertDescription>
        </Alert>
      )}

      {done && (
        // Announced politely rather than as an alert: it is a confirmation,
        // and the section stays where it is instead of taking over the page.
        <Alert variant="success" aria-live="polite">
          <CheckCircle2 aria-hidden />
          <AlertTitle>Password updated</AlertTitle>
          <AlertDescription>
            You can now continue using your Atlantic RMS account.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="New password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Enter a new password"
          helper={PASSWORD_HINT}
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            setDone(false);
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
            setDone(false);
            if (confirmErr) setConfirmErr(confirmPasswordError(pw, e.target.value));
          }}
          onBlur={() => setConfirmErr(confirmPasswordError(pw, confirm))}
          error={confirmErr ?? undefined}
        />
      </div>

      <Button
        type="submit"
        loading={busy}
        loadingText="Changing password…"
        disabled={!pw && !confirm}
        className="self-start"
      >
        Change password
      </Button>
    </form>
  );
}
