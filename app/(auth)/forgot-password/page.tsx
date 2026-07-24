"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthShell, AuthField } from "@/components/auth/auth-shell";
import { isValidEmailFormat, isSupportedEmail, normalizeEmail, approvedDomainsSentence } from "@/lib/auth/companies";
import { requestPasswordReset } from "@/lib/auth/access-store";

function emailError(v: string): string | null {
  const e = v.trim();
  if (!e) return "Enter your corporate email.";
  if (!isValidEmailFormat(e)) return "Enter a valid email address.";
  if (!isSupportedEmail(e)) return `Use an approved corporate email ending in ${approvedDomainsSentence(true, "or")}.`;
  return null;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ee = emailError(email);
    setErr(ee);
    if (ee) return document.getElementById("fp-email")?.focus();
    setLoading(true);
    window.setTimeout(() => {
      // Always show the same result — never reveal whether an account exists.
      requestPasswordReset(normalizeEmail(email));
      setSent(normalizeEmail(email));
      setLoading(false);
    }, 500);
  };

  if (sent) {
    return (
      <AuthShell
        icon={<div className="grid size-12 place-items-center rounded-full bg-success/10 text-success"><MailCheck className="size-6" /></div>}
        title="Check your email"
        description={<>If an active account exists for <span className="font-medium text-foreground">{sent}</span>, we sent a password-reset link.</>}
        footer={<Link href="/login" className="font-medium text-primary hover:underline">Back to log in</Link>}
      >
        <p className="text-center text-sm text-muted-foreground">Check your inbox and spam folder.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Enter your corporate email and we’ll send you a password-reset link."
      footer={<Link href="/login" className="font-medium text-primary hover:underline">Back to log in</Link>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <AuthField
          id="fp-email" label="Corporate email" required type="email" inputMode="email" autoComplete="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (err) setErr(emailError(e.target.value)); }}
          onBlur={() => setErr(emailError(email))}
          error={err}
        />
        <Button type="submit" className="w-full" disabled={loading} aria-busy={loading}>
          {loading ? "Sending reset link…" : "Send reset link"}
        </Button>
      </form>
    </AuthShell>
  );
}
