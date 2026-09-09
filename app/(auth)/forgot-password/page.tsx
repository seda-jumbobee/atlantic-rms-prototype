"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, MailCheck } from "lucide-react";

import { AuthFields, AuthHeader, AuthLayout } from "@/components/auth/auth-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { isValidEmailFormat, normalizeEmail, expiryLabel, RESET_TOKEN_TTL_HOURS } from "@/lib/auth/companies";
import { formatWait, requestPasswordResetGuarded } from "@/lib/auth/access-store";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  function validate(v: string): string | null {
    if (!v.trim()) return "Enter your corporate email.";
    if (!isValidEmailFormat(v)) return "Enter a valid email address.";
    return null;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (busy) return;

    const e = validate(email);
    setErr(e);
    if (e) {
      emailRef.current?.focus();
      return;
    }

    setFailure(null);
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 450));
      const res = requestPasswordResetGuarded(email);
      if (res.kind === "accepted") {
        setSentTo(normalizeEmail(email));
      } else if (res.kind === "cooldown") {
        setFailure(`You just requested a link. Try again in ${formatWait(res.retryInMs)}.`);
      } else {
        // Reported for every address, so this cannot be used to detect accounts.
        setFailure("We couldn’t send the email right now. Try again shortly.");
      }
    } catch {
      setFailure("We couldn’t send the email. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  /* ── Success — deliberately does NOT confirm the account exists ─────────── */
  if (sentTo) {
    return (
      <AuthLayout>
        <AuthHeader title="Check your email" showWelcome />
        <div className="flex flex-col gap-5">
          <Alert variant="info">
            <MailCheck aria-hidden />
            <AlertTitle>
              If an active account exists for {sentTo}, we sent you a password-reset link.
            </AlertTitle>
            <AlertDescription>
              The link is valid for {expiryLabel(RESET_TOKEN_TTL_HOURS)} and can be used once.
              Check your spam folder if it hasn’t arrived.
            </AlertDescription>
          </Alert>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/login">Back to log in</Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSentTo(null);
                setFailure(null);
              }}
            >
              Use a different email
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthHeader
        title="Reset your password"
        description="Enter your corporate email and we’ll send you a password-reset link."
        showWelcome
      />

      <div className="flex flex-col gap-5">
        {failure && (
          <Alert variant="destructive">
            <AlertCircle aria-hidden />
            <AlertTitle>{failure}</AlertTitle>
          </Alert>
        )}

        <form onSubmit={submit} noValidate className="flex flex-col gap-6">
          <AuthFields>
            <TextField
              ref={emailRef}
              label="Corporate email"
              type="email"
              required
              inputMode="email"
              autoComplete="email"
              autoFocus
              placeholder="name@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (err) setErr(null);
              }}
              error={err}
            />
          </AuthFields>

          <div className="flex flex-col gap-3">
            <Button type="submit" className="w-full" loading={busy} loadingText="Sending link…">
              Send reset link
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/login">Back to log in</Link>
            </Button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
