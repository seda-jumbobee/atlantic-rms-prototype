"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthShell, AuthField } from "@/components/auth/auth-shell";
import {
  COMPANIES, companyForEmail, isValidEmailFormat, isSupportedEmail,
  normalizeEmail, cleanName, fullNameError, approvedDomainsSentence,
} from "@/lib/auth/companies";
import { submitRequest, resendActivation, type SubmitOutcome } from "@/lib/auth/access-store";

function emailError(v: string): string | null {
  const e = v.trim();
  if (!e) return "Enter your corporate email.";
  if (!isValidEmailFormat(e)) return "Enter a valid email address.";
  if (!isSupportedEmail(e)) return "Use your company email, for example name@jumbobee.com.";
  return null;
}

export default function RequestAccessPage() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [companyErr, setCompanyErr] = useState<string | null>(null);
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Exclude<SubmitOutcome["kind"], "ok"> | "error" | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const doResend = () => {
    if (cooldown > 0) return;
    resendActivation(normalizeEmail(email));
    setResent(true);
    setCooldown(30);
    const iv = window.setInterval(() => setCooldown((c) => { if (c <= 1) { window.clearInterval(iv); return 0; } return c - 1; }), 1000);
  };

  const matched = isSupportedEmail(email) ? companyForEmail(email) : null;

  const companyError = (companyId: string, mail: string): string | null => {
    if (!companyId) return "Select your company.";
    const m = isSupportedEmail(mail) ? companyForEmail(mail) : null;
    if (m && companyId !== m.id) return `This email belongs to ${m.name}. Select ${m.name} or use a different email.`;
    return null;
  };

  const onEmailChange = (v: string) => {
    setEmail(v);
    if (emailErr) setEmailErr(emailError(v));
    // auto-preselect the company from a supported domain (prevents mismatch)
    const m = isSupportedEmail(v) ? companyForEmail(v) : null;
    if (m) { setCompany(m.id); setCompanyErr(null); }
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const ee = emailError(email);
    const ce = companyError(company, email);
    const ne = fullNameError(name);
    setEmailErr(ee); setCompanyErr(ce); setNameErr(ne);
    if (ee) return document.getElementById("ra-email")?.focus();
    if (ce) return document.getElementById("ra-company")?.focus();
    if (ne) return document.getElementById("ra-name")?.focus();

    setOutcome(null);
    setLoading(true);
    window.setTimeout(() => {
      try {
        const res = submitRequest({ name: cleanName(name), email: normalizeEmail(email), companyId: company });
        if (res.kind === "ok") setSubmitted(normalizeEmail(email));
        else setOutcome(res.kind);
      } catch {
        setOutcome("error");
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  // ── Request submitted (dedicated confirmation state) ──
  if (submitted) {
    return (
      <AuthShell
        icon={<div className="grid size-12 place-items-center rounded-full bg-success/10 text-success"><MailCheck className="size-6" /></div>}
        title="Request submitted"
        description={<>Your request has been sent to an administrator. We’ll email <span className="font-medium text-foreground">{submitted}</span> when it is approved or declined.</>}
        footer={
          <div className="flex flex-col items-center gap-1.5">
            <Link href="/login" className="font-medium text-primary hover:underline">Back to log in</Link>
            <button type="button" onClick={() => { setSubmitted(null); setEmail(""); setCompany(""); setName(""); }} className="text-muted-foreground hover:text-foreground hover:underline">Use a different email</button>
          </div>
        }
      >
        <p className="text-center text-sm text-muted-foreground">You don’t need to submit another request.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Request access"
      description="Use your corporate email to request access to Atlantic RMS. An administrator will review your request."
      footer={<span>Already have an account?{" "}<Link href="/login" className="font-medium text-primary hover:underline">Log in</Link></span>}
    >
      <div aria-live="polite">
        {outcome === "active-account" && (
          <Alert className="mb-4">
            <AlertCircle className="size-4" />
            <AlertTitle>Account already exists</AlertTitle>
            <AlertDescription>
              An account already exists for this email.
              <span className="mt-2 flex gap-2">
                <Button asChild size="sm"><Link href="/login">Log in</Link></Button>
                <Button asChild size="sm" variant="outline"><Link href="/forgot-password">Reset password</Link></Button>
              </span>
            </AlertDescription>
          </Alert>
        )}
        {outcome === "pending" && (
          <Alert className="mb-4">
            <AlertCircle className="size-4" />
            <AlertDescription>
              A request for this email is already under review. We’ll email you when a decision is made.
              <Link href="/login" className="mt-1 block font-medium text-primary hover:underline">Back to log in</Link>
            </AlertDescription>
          </Alert>
        )}
        {outcome === "approved-incomplete" && (
          <Alert className="mb-4">
            <MailCheck className="size-4" />
            <AlertDescription>
              Your request has already been approved. Check your email to finish setting up your account.
              {resent && <span className="mt-1 block text-success">Setup email sent. Check your inbox and spam folder.</span>}
              <button type="button" onClick={doResend} disabled={cooldown > 0} className="mt-1 block font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline">
                {cooldown > 0 ? `Resend setup email (${cooldown}s)` : "Resend setup email"}
              </button>
            </AlertDescription>
          </Alert>
        )}
        {outcome === "rejected" && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="size-4" />
            <AlertDescription>A previous request for this email was not approved. Contact your administrator before submitting another request.</AlertDescription>
          </Alert>
        )}
        {outcome === "error" && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="size-4" />
            <AlertDescription>We couldn’t submit your request. Check your connection and try again.</AlertDescription>
          </Alert>
        )}
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <AuthField
          id="ra-email"
          label="Corporate email"
          required
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          onBlur={() => setEmailErr(emailError(email))}
          error={emailErr}
          hint={emailErr ? undefined : `Approved domains: ${approvedDomainsSentence(false, "and")}.`}
        />

        <div className="space-y-1.5">
          <Label htmlFor="ra-company"><span>Company<span aria-hidden className="ml-0.5 text-sidebar-primary">*</span></span></Label>
          <Select
            value={company}
            onValueChange={(v) => { setCompany(v); setCompanyErr(companyError(v, email)); }}
          >
            <SelectTrigger id="ra-company" aria-invalid={!!companyErr} aria-describedby={companyErr ? "ra-company-err" : undefined} className="w-full">
              <SelectValue placeholder="Select your company" />
            </SelectTrigger>
            <SelectContent>
              {COMPANIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {companyErr && <p id="ra-company-err" role="alert" className="text-xs font-medium text-destructive">{companyErr}</p>}
          {!companyErr && matched && company === matched.id && (
            <p className="flex items-center gap-1 text-xs text-success"><CheckCircle2 className="size-3.5" /> Matched from your email domain.</p>
          )}
        </div>

        <AuthField
          id="ra-name"
          label="Full name"
          required
          autoComplete="name"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => { setName(e.target.value); if (nameErr) setNameErr(fullNameError(e.target.value)); }}
          onBlur={() => setNameErr(fullNameError(name))}
          error={nameErr}
        />

        <Button type="submit" className="w-full" disabled={loading} aria-busy={loading}>
          {loading ? "Submitting request…" : "Submit request"}
        </Button>
      </form>
    </AuthShell>
  );
}
