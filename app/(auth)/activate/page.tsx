"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock, Link2Off } from "lucide-react";

import { AuthFields, AuthHeader, AuthLayout } from "@/components/auth/auth-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ReadOnlyField, TextField } from "@/components/ui/field";
import { PASSWORD_HINT, companyById, confirmPasswordError, passwordError } from "@/lib/auth/companies";
import {
  activateAccount, isEmailOutage, resendActivation, setPasswordForEmail,
  validateActivation, type AccessRequest, type LinkState,
} from "@/lib/auth/access-store";

function LinkProblem({
  state,
  email,
}: {
  state: Exclude<LinkState, "valid">;
  email?: string;
}) {
  const [resend, setResend] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  const copy: Record<string, { title: string; body: string; icon: typeof Clock; canResend: boolean }> = {
    expired: {
      title: "This setup link has expired.",
      body: "Setup links are valid for a limited time. Request a new one and we’ll email it to you.",
      icon: Clock,
      canResend: true,
    },
    used: {
      title: "This setup link has already been used.",
      body: "Your account is already set up. Log in with the password you created, or reset it if you’ve forgotten it.",
      icon: Link2Off,
      canResend: false,
    },
    invalid: {
      title: "This setup link is invalid.",
      body: "Check that you opened the most recent email from us, or ask your administrator to resend it.",
      icon: Link2Off,
      canResend: false,
    },
    unavailable: {
      title: "This link is no longer available.",
      body: "Your access request is not active. Contact your administrator for help.",
      icon: AlertCircle,
      canResend: false,
    },
  };
  const c = copy[state] ?? copy.invalid;
  const Icon = c.icon;

  async function doResend() {
    if (!email || resend === "sending") return;
    setResend("sending");
    const outage = isEmailOutage();
    const req = resendActivation(email);
    await new Promise((r) => setTimeout(r, 400));
    setResend(!req || outage || req.emailFailed ? "failed" : "sent");
  }

  return (
    <AuthLayout>
      <AuthHeader title="Finish setting up your account" showWelcome />
      <div className="flex flex-col gap-5">
        <Alert variant="destructive">
          <Icon aria-hidden />
          <AlertTitle>{c.title}</AlertTitle>
          <AlertDescription>{c.body}</AlertDescription>
        </Alert>

        {c.canResend && email && (
          <div aria-live="polite">
            {resend === "sent" ? (
              <Alert variant="success">
                <CheckCircle2 aria-hidden />
                <AlertTitle>New setup email sent to {email}.</AlertTitle>
              </Alert>
            ) : resend === "failed" ? (
              <Alert variant="destructive">
                <AlertCircle aria-hidden />
                <AlertTitle>We couldn’t send the setup email.</AlertTitle>
                <AlertDescription>Try again shortly, or contact your administrator.</AlertDescription>
              </Alert>
            ) : (
              <Button
                type="button"
                onClick={doResend}
                loading={resend === "sending"}
                loadingText="Sending…"
              >
                Send a new setup link
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant={c.canResend ? "outline" : "default"}>
            <Link href="/login">Back to log in</Link>
          </Button>
          {state === "used" && (
            <Button asChild variant="ghost">
              <Link href="/forgot-password">Reset password</Link>
            </Button>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}

function ActivateForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [state, setState] = useState<LinkState | "checking">("checking");
  const [req, setReq] = useState<AccessRequest | undefined>();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [confirmErr, setConfirmErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const pwRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const res = validateActivation(token);
    setState(res.state);
    setReq(res.request);
  }, [token]);

  if (state === "checking") {
    return (
      <AuthLayout>
        <AuthHeader title="Create your password" description="Checking your link…" />
      </AuthLayout>
    );
  }
  if (state !== "valid") return <LinkProblem state={state} email={req?.email} />;

  if (done) {
    return (
      <AuthLayout>
        <AuthHeader title="Account created" showWelcome />
        <div className="flex flex-col gap-5">
          <Alert variant="success">
            <CheckCircle2 aria-hidden />
            <AlertTitle>Your Rate Management System account is ready.</AlertTitle>
            <AlertDescription>Log in with your corporate email and new password.</AlertDescription>
          </Alert>
          <Button asChild className="w-fit">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (busy) return;

    const pe = passwordError(pw, req?.email);
    const ce = confirmPasswordError(pw, confirm);
    setPwErr(pe);
    setConfirmErr(ce);
    if (pe) return pwRef.current?.focus();
    if (ce) return confirmRef.current?.focus();

    setFailure(null);
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 450));
      const res = activateAccount(token);
      if (!res.ok) {
        const recheck = validateActivation(token);
        setState(recheck.state === "valid" ? "used" : recheck.state);
        setReq(recheck.request);
        return;
      }
      if (res.request) await setPasswordForEmail(res.request.email, pw);
      setDone(true);
    } catch {
      setFailure("We couldn’t create your account. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const company = companyById(req?.companyId);

  return (
    <AuthLayout>
      <AuthHeader
        title="Create your password"
        description="Your access has been approved. Create a password to finish setting up your account."
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
            {/* Identity is fixed by the approved request — shown, not editable. */}
            <ReadOnlyField label="Corporate email" value={req?.email ?? "—"} />
            <ReadOnlyField label="Company" value={company?.name ?? "—"} />

            <TextField
              ref={pwRef}
              label="New password"
              type="password"
              required
              autoComplete="new-password"
              autoFocus
              placeholder="Create a password"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                if (pwErr) setPwErr(null);
              }}
              error={pwErr}
              helper={PASSWORD_HINT}
            />
            <TextField
              ref={confirmRef}
              label="Confirm password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (confirmErr) setConfirmErr(null);
              }}
              error={confirmErr}
            />
          </AuthFields>

          <Button type="submit" className="w-full" loading={busy} loadingText="Creating account…">
            Create account
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}

export default function ActivatePage() {
  return (
    <Suspense
      fallback={
        <AuthLayout>
          <AuthHeader title="Create your password" description="Checking your link…" />
        </AuthLayout>
      }
    >
      <ActivateForm />
    </Suspense>
  );
}
