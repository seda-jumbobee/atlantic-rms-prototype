"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, CheckCircle2, Info, MailWarning } from "lucide-react";

import { AuthFields, AuthHeader, AuthLayout, AuthSupportCard, WELCOME_TITLE } from "@/components/auth/auth-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldHelper, FieldLabel, TextField } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stepper } from "@/components/ui/stepper";
import {
  COMPANIES, approvedDomainsSentence, cleanName, companyById, companyForEmail, fullNameError,
  isSupportedEmail, isValidEmailFormat, normalizeEmail,
} from "@/lib/auth/companies";
import { isEmailOutage, resendActivation, submitRequest, type SubmitOutcome } from "@/lib/auth/access-store";

function emailError(v: string): string | null {
  const e = v.trim();
  if (!e) return "Enter your corporate email.";
  // Selecting a company prefills "@domain", so "nothing before the @" is a
  // state we create ourselves — name it precisely instead of "invalid email".
  if (e.startsWith("@")) return "Enter the part of your email before the @.";
  if (!isValidEmailFormat(e)) return "Enter a valid email address.";
  if (!isSupportedEmail(e)) return "Use your company email, for example name@jumbobee.com.";
  return null;
}

type Outcome = Exclude<SubmitOutcome["kind"], "ok"> | "error" | null;

export default function RequestAccessPage() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [companyErr, setCompanyErr] = useState<string | null>(null);
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [resend, setResend] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [cooldown, setCooldown] = useState(0);
  /** Which input decided the company — drives whether the "matched" hint shows. */
  const [companySource, setCompanySource] = useState<"none" | "manual" | "email">("none");

  const emailRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLButtonElement>(null);

  const matched = isSupportedEmail(email) ? companyForEmail(email) : null;

  function companyError(companyId: string, mail: string): string | null {
    if (!companyId) return "Select your company.";
    const m = isSupportedEmail(mail) ? companyForEmail(mail) : null;
    if (m && companyId !== m.id) {
      return `This email belongs to ${m.name}. Select ${m.name}, or use a different email.`;
    }
    return null;
  }

  /**
   * Company drives the email: picking one fills in that company's domain so the
   * user only has to type the part that is actually theirs. Anything already
   * typed before the "@" is preserved, so switching company swaps the domain
   * rather than wiping the address.
   *
   * Focus is deliberately left where it is. Any error is cleared, so selecting
   * a company never lands the user in an error state for a value the app just
   * wrote itself — the email is only validated once they leave the field.
   */
  function onCompanyChange(id: string) {
    setCompany(id);
    setCompanySource("manual");
    setCompanyErr(null);

    const c = companyById(id);
    if (!c) return;

    const at = email.indexOf("@");
    const local = (at >= 0 ? email.slice(0, at) : email).trim();
    setEmail(`${local}@${c.domain}`);
    setEmailErr(null);
  }

  function onEmailChange(v: string) {
    setEmail(v);
    if (emailErr) setEmailErr(emailError(v));
    // A recognised domain still corrects the company, so pasting a full address
    // works and a mismatch can't be submitted by accident.
    const m = isSupportedEmail(v) ? companyForEmail(v) : null;
    if (m) {
      setCompany(m.id);
      setCompanySource("email");
      setCompanyErr(null);
    }
  }

  async function doResend() {
    if (resend === "sending" || cooldown > 0) return;
    setResend("sending");
    const outage = isEmailOutage();
    const req = resendActivation(normalizeEmail(email));
    await new Promise((r) => setTimeout(r, 400));
    if (!req || outage || req.emailFailed) {
      setResend("failed");
      return;
    }
    setResend("sent");
    setCooldown(60);
    const iv = window.setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          window.clearInterval(iv);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (busy) return;

    const ee = emailError(email);
    const ce = companyError(company, email);
    const ne = fullNameError(name);
    setEmailErr(ee);
    setCompanyErr(ce);
    setNameErr(ne);
    if (ce) return companyRef.current?.focus();
    if (ee) return emailRef.current?.focus();
    if (ne) return nameRef.current?.focus();

    setOutcome(null);
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 450));
      const res = submitRequest({
        name: cleanName(name),
        email: normalizeEmail(email),
        companyId: company,
      });
      if (res.kind === "ok") setSubmitted(normalizeEmail(email));
      else setOutcome(res.kind);
    } catch {
      setOutcome("error");
    } finally {
      setBusy(false);
    }
  }

  /* ── Request submitted ─────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <AuthLayout>
        {/* Centred confirmation: success mark, then the message. */}
        <header className="flex flex-col items-center gap-5 text-center">
          <p className="text-label text-muted-foreground xl:hidden">{WELCOME_TITLE}</p>
          <div
            aria-hidden
            className="grid size-16 shrink-0 place-items-center rounded-full bg-success"
          >
            <Check className="size-8 text-white" strokeWidth={3} />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-h1 text-balance text-foreground">Request sent</h1>
            <p className="text-body text-balance text-muted-foreground">
              We’ve received your request for{" "}
              <span className="font-bold text-foreground">{submitted}</span>. Once your access is
              approved, you’ll receive an email to finish setting up your account.
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-8">
          {/* What happens next. Approval is a person, not an automatic step. */}
          <Stepper
            ariaLabel="Access request progress"
            steps={[
              { label: "Request received", state: "complete" },
              { label: "Admin approved", state: "current", hint: "Waiting on an administrator" },
              { label: "Approval email", state: "upcoming", hint: "Link to create your password" },
            ]}
          />

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/login">Back to log in</Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSubmitted(null);
                setEmail("");
                setCompany("");
                setName("");
                setCompanySource("none");
              }}
            >
              Use a different email
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  /* ── Form ──────────────────────────────────────────────────────────────── */
  return (
    <AuthLayout>
      <AuthHeader
        title="Request access"
        description="Use your corporate email to request access to Rate Management System. An administrator will review your request."
        showWelcome
      />

      <div className="flex flex-col gap-5">
        <div aria-live="polite" className="contents">
          {outcome === "active-account" && (
            <Alert>
              <AlertCircle aria-hidden />
              <AlertTitle>An account already exists for this email.</AlertTitle>
              <AlertDescription className="mt-2 flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/forgot-password">Reset password</Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {outcome === "pending" && (
            <Alert variant="info">
              <Info aria-hidden />
              <AlertTitle>A request for this email is already under review.</AlertTitle>
              <AlertDescription>We’ll email you when a decision is made.</AlertDescription>
            </Alert>
          )}
          {outcome === "approved-incomplete" && (
            <Alert variant="warning">
              <MailWarning aria-hidden />
              <AlertTitle>Your request has already been approved.</AlertTitle>
              <AlertDescription>
                Check your email to finish setting up your account.
                <span className="mt-2 block">
                  {resend === "sent" ? (
                    <span className="text-status-positive-fg">
                      Setup email sent. Check your inbox and spam folder.
                    </span>
                  ) : resend === "failed" ? (
                    <span className="text-status-negative-fg">
                      We couldn’t send the setup email. Try again shortly.
                    </span>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={doResend}
                      disabled={cooldown > 0}
                      loading={resend === "sending"}
                      loadingText="Sending…"
                    >
                      {cooldown > 0 ? `Resend setup email (${cooldown}s)` : "Resend setup email"}
                    </Button>
                  )}
                </span>
              </AlertDescription>
            </Alert>
          )}
          {outcome === "rejected" && (
            <Alert variant="destructive">
              <AlertCircle aria-hidden />
              <AlertTitle>A previous request for this email was not approved.</AlertTitle>
              <AlertDescription>
                Contact your administrator before submitting another request.
              </AlertDescription>
            </Alert>
          )}
          {outcome === "error" && (
            <Alert variant="destructive">
              <AlertCircle aria-hidden />
              <AlertTitle>We couldn’t submit your request.</AlertTitle>
              <AlertDescription>Check your connection and try again.</AlertDescription>
            </Alert>
          )}
        </div>

        <form onSubmit={submit} noValidate className="flex flex-col gap-6">
          <AuthFields>
            {/* Company first — it decides the email domain, so asking for it up
                front removes the possibility of a mismatch. */}
            <Field>
              <FieldLabel htmlFor="ra-company" required>
                Company
              </FieldLabel>
              <Select value={company} onValueChange={onCompanyChange}>
                <SelectTrigger
                  ref={companyRef}
                  id="ra-company"
                  autoFocus
                  aria-invalid={companyErr ? true : undefined}
                  aria-describedby={
                    companyErr
                      ? "ra-company-err"
                      : companySource === "email" && matched
                        ? "ra-company-ok"
                        : "ra-company-hint"
                  }
                  className="w-full"
                >
                  <SelectValue placeholder="Select your company" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {companyErr ? (
                <FieldError id="ra-company-err">{companyErr}</FieldError>
              ) : companySource === "email" && matched && company === matched.id ? (
                <p id="ra-company-ok" className="flex items-center gap-1.5 text-caption text-status-positive-fg">
                  <CheckCircle2 aria-hidden className="size-3.5" />
                  Matched from your email domain.
                </p>
              ) : (
                <FieldHelper id="ra-company-hint">
                  We’ll fill in your company’s email domain for you.
                </FieldHelper>
              )}
            </Field>

            <TextField
              ref={emailRef}
              label="Corporate email"
              type="email"
              required
              inputMode="email"
              autoComplete="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              onBlur={() => setEmailErr(emailError(email))}
              error={emailErr}
              helper={
                company
                  ? undefined
                  : `Approved domains: ${approvedDomainsSentence(false, "and")}.`
              }
            />

            <TextField
              ref={nameRef}
              label="Full name"
              required
              autoComplete="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameErr) setNameErr(fullNameError(e.target.value));
              }}
              onBlur={() => setNameErr(fullNameError(name))}
              error={nameErr}
            />
          </AuthFields>

          <Button type="submit" className="w-full" loading={busy} loadingText="Submitting request…">
            Submit request
          </Button>
        </form>
      </div>

      <AuthSupportCard>
        <span className="text-body font-bold text-foreground">Already have an account?</span>
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Log in</Link>
        </Button>
      </AuthSupportCard>
    </AuthLayout>
  );
}
