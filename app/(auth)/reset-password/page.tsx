"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock, Link2Off } from "lucide-react";

import { AuthFields, AuthHeader, AuthLayout } from "@/components/auth/auth-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import {
  PASSWORD_HINT, confirmPasswordError, passwordError,
} from "@/lib/auth/companies";
import {
  completeReset, setPasswordForEmail, validateReset, type LinkState,
} from "@/lib/auth/access-store";

function LinkProblem({
  state,
}: {
  state: Exclude<LinkState, "valid">;
}) {
  const copy: Record<string, { title: string; body: string; icon: typeof Clock }> = {
    expired: {
      title: "This reset link has expired.",
      body: "Reset links are valid for a limited time and can only be used once. Request a new one to continue.",
      icon: Clock,
    },
    used: {
      title: "This reset link has already been used.",
      body: "If you still need to change your password, request a new link.",
      icon: Link2Off,
    },
    invalid: {
      title: "This reset link is invalid.",
      body: "Check that you opened the most recent email, or request a new link.",
      icon: Link2Off,
    },
    unavailable: {
      title: "This link is no longer available.",
      body: "Contact your administrator for help with your account.",
      icon: AlertCircle,
    },
  };
  const c = copy[state] ?? copy.invalid;
  const Icon = c.icon;

  return (
    <AuthLayout>
      <AuthHeader title="Reset your password" showWelcome />
      <div className="flex flex-col gap-5">
        <Alert variant="destructive">
          <Icon aria-hidden />
          <AlertTitle>{c.title}</AlertTitle>
          <AlertDescription>{c.body}</AlertDescription>
        </Alert>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/login">Back to log in</Link>
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [state, setState] = useState<LinkState | "checking">("checking");
  const [email, setEmail] = useState<string | undefined>();
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
    const res = validateReset(token);
    setState(res.state);
    setEmail(res.email);
  }, [token]);

  if (state === "checking") {
    return (
      <AuthLayout>
        <AuthHeader title="Reset your password" description="Checking your link…" />
      </AuthLayout>
    );
  }
  if (state !== "valid") return <LinkProblem state={state} />;

  if (done) {
    return (
      <AuthLayout>
        <AuthHeader title="Password updated" showWelcome />
        <div className="flex flex-col gap-5">
          <Alert variant="success">
            <CheckCircle2 aria-hidden />
            <AlertTitle>You can now log in with your new password.</AlertTitle>
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

    const pe = passwordError(pw, email);
    const ce = confirmPasswordError(pw, confirm);
    setPwErr(pe);
    setConfirmErr(ce);
    if (pe) return pwRef.current?.focus();
    if (ce) return confirmRef.current?.focus();

    setFailure(null);
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 450));
      const res = completeReset(token);
      if (!res.ok) {
        // The link was consumed or expired between load and submit.
        const recheck = validateReset(token);
        setState(recheck.state === "valid" ? "used" : recheck.state);
        return;
      }
      if (res.email) await setPasswordForEmail(res.email, pw);
      setDone(true);
    } catch {
      setFailure("We couldn’t update your password. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <AuthHeader
        title="Create a new password"
        description={
          email ? (
            <>
              Choose a new password for <span className="font-medium text-foreground">{email}</span>.
            </>
          ) : (
            "Choose a new password for your account."
          )
        }
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
              ref={pwRef}
              label="New password"
              type="password"
              required
              autoComplete="new-password"
              autoFocus
              placeholder="Enter a new password"
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
              placeholder="Re-enter your new password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (confirmErr) setConfirmErr(null);
              }}
              error={confirmErr}
            />
          </AuthFields>

          <Button type="submit" className="w-full" loading={busy} loadingText="Updating password…">
            Update password
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout>
          <AuthHeader title="Reset your password" description="Checking your link…" />
        </AuthLayout>
      }
    >
      <ResetForm />
    </Suspense>
  );
}
