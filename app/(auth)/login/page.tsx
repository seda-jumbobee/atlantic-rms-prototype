"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Clock, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AuthShell, AuthField, PasswordField } from "@/components/auth/auth-shell";
import { useSession } from "@/components/session-provider";
import { USERS, DEFAULT_MANAGER } from "@/lib/data/users";
import {
  isValidEmailFormat, isSupportedEmail, normalizeEmail, approvedDomainsSentence,
} from "@/lib/auth/companies";
import { accountForEmail, getRequestByEmail, resendActivation } from "@/lib/auth/access-store";

type State =
  | { kind: "idle" }
  | { kind: "incorrect" }
  | { kind: "pending" }
  | { kind: "approved-incomplete"; email: string }
  | { kind: "rejected" }
  | { kind: "deactivated" }
  | { kind: "too-many"; until: number }
  | { kind: "network" };

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 60;
const RESEND_COOLDOWN = 30;

function emailError(v: string): string | null {
  const e = v.trim();
  if (!e) return "Enter your corporate email.";
  if (!isValidEmailFormat(e)) return "Enter a valid email address.";
  if (!isSupportedEmail(e)) return `Use an approved corporate email ending in ${approvedDomainsSentence(true, "or")}.`;
  return null;
}

export default function LoginPage() {
  const { loginAs } = useSession();
  const router = useRouter();
  const sp = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [state, setState] = useState<State>({ kind: "idle" });
  const [loading, setLoading] = useState(false);
  const attempts = useRef(0);
  const focusField = (id: string) => document.getElementById(id)?.focus();

  // resend cooldown
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const next = useMemo(() => {
    const n = sp.get("next");
    return n && n.startsWith("/") && !n.startsWith("//") ? n : "/";
  }, [sp]);

  const succeed = (e: string) => {
    const u = USERS.find((x) => x.email.toLowerCase() === normalizeEmail(e));
    loginAs(u?.id ?? DEFAULT_MANAGER.id); // activated prototype accounts stand in as the default manager
    router.push(next);
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const ee = emailError(email);
    const pe = password ? null : "Enter your password.";
    setEmailErr(ee);
    setPwErr(pe);
    if (ee) { focusField("email"); return; }
    if (pe) { focusField("password"); return; }

    if (state.kind === "too-many" && state.until > Date.now()) return;

    setLoading(true);
    // simulate the round-trip so loading state is visible; no real backend
    window.setTimeout(() => {
      try {
        const e = normalizeEmail(email);
        const acct = accountForEmail(e);
        if (acct.active) { succeed(e); return; }

        const req = getRequestByEmail(e);
        if (req?.status === "pending") setState({ kind: "pending" });
        else if (req?.status === "approved") setState({ kind: "approved-incomplete", email: e });
        else if (req?.status === "rejected") setState({ kind: "rejected" });
        else if (acct.exists && !acct.active) setState({ kind: "deactivated" });
        else {
          attempts.current += 1;
          if (attempts.current >= MAX_ATTEMPTS) setState({ kind: "too-many", until: Date.now() + LOCK_SECONDS * 1000 });
          else setState({ kind: "incorrect" });
        }
      } catch {
        setState({ kind: "network" });
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const doResend = (e: string) => {
    if (cooldown > 0) return;
    resendActivation(e);
    setResent(true);
    setCooldown(RESEND_COOLDOWN);
    const iv = window.setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { window.clearInterval(iv); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const backToLogin = () => { setState({ kind: "idle" }); setResent(false); };

  // live "too many" countdown label
  const [, force] = useState(0);
  if (state.kind === "too-many") {
    const remaining = Math.max(0, Math.ceil((state.until - Date.now()) / 1000));
    if (remaining > 0) setTimeout(() => force((n) => n + 1), 1000);
  }

  return (
    <AuthShell
      title="Log in to Atlantic RMS"
      description="Use your corporate email and password to continue."
      footer={
        <div className="flex flex-col items-center gap-1.5">
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">Forgot password?</Link>
          <span>Need access?{" "}
            <Link href="/request-access" className="font-medium text-primary hover:underline">Request access</Link>
          </span>
        </div>
      }
    >
      {/* live region for auth-state announcements */}
      <div aria-live="polite">
        {state.kind === "incorrect" && (
          <Alert variant="destructive" className="mb-4"><AlertCircle className="size-4" /><AlertDescription>Email or password is incorrect.</AlertDescription></Alert>
        )}
        {state.kind === "network" && (
          <Alert variant="destructive" className="mb-4"><AlertCircle className="size-4" /><AlertDescription>We couldn’t log you in. Check your connection and try again.</AlertDescription></Alert>
        )}
        {state.kind === "too-many" && (
          <Alert variant="destructive" className="mb-4">
            <Clock className="size-4" />
            <AlertDescription>
              Too many unsuccessful attempts. Try again in {Math.max(0, Math.ceil((state.until - Date.now()) / 1000))}s, or{" "}
              <Link href="/forgot-password" className="font-medium underline">reset your password</Link>.
            </AlertDescription>
          </Alert>
        )}
        {state.kind === "pending" && (
          <Alert className="mb-4">
            <Clock className="size-4" />
            <AlertTitle>Access request under review</AlertTitle>
            <AlertDescription>
              Your access request is still under review. We’ll email you when a decision is made.
              <button type="button" onClick={backToLogin} className="mt-1 block font-medium text-primary hover:underline">Back to log in</button>
            </AlertDescription>
          </Alert>
        )}
        {state.kind === "rejected" && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="size-4" />
            <AlertDescription>Your access request was not approved. Contact your administrator if you believe this is a mistake.</AlertDescription>
          </Alert>
        )}
        {state.kind === "deactivated" && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="size-4" />
            <AlertDescription>This account is inactive. Contact your administrator for help.</AlertDescription>
          </Alert>
        )}
        {state.kind === "approved-incomplete" && (
          <Alert className="mb-4">
            <MailCheck className="size-4" />
            <AlertTitle>Finish setting up your account</AlertTitle>
            <AlertDescription>
              Your access request was approved. Check your email to finish setting up your account.
              {resent ? (
                <span className="mt-1 block text-success">Setup email sent. Check your inbox and spam folder.</span>
              ) : null}
              <button
                type="button"
                onClick={() => doResend(state.email)}
                disabled={cooldown > 0}
                className="mt-1 block font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {cooldown > 0 ? `Resend setup email (${cooldown}s)` : "Resend setup email"}
              </button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <AuthField
          id="email"
          label="Corporate email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (emailErr) setEmailErr(emailError(e.target.value)); }}
          onBlur={() => setEmailErr(emailError(email))}
          error={emailErr}
          hint={emailErr ? undefined : "Use your Atlantic Project Cargo, JumboBee, or Atlantic Express Corp email."}
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (pwErr) setPwErr(e.target.value ? null : "Enter your password."); }}
          onBlur={() => setPwErr(password ? null : "Enter your password.")}
          error={pwErr}
        />
        <Button type="submit" className="w-full" disabled={loading} aria-busy={loading}>
          {loading ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </AuthShell>
  );
}
