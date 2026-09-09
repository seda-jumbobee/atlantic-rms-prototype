"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AlertCircle, CheckCircle2, Info, MailWarning } from "lucide-react";

import { AuthFields, AuthHeader, AuthLayout, AuthSupportCard } from "@/components/auth/auth-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TextField } from "@/components/ui/field";
import { rememberedEmail, useSession } from "@/components/session-provider";
import { COMPANIES, isValidEmailFormat, joinList, normalizeEmail } from "@/lib/auth/companies";
import { formatWait, isEmailOutage, resendActivation } from "@/lib/auth/access-store";
import type { LoginOutcome } from "@/lib/auth/access-store";

const RESEND_COOLDOWN_MS = 60_000;
/** "Atlantic Project Cargo, JumboBee, or Atlantic Express Corp" — from the central config. */
const COMPANY_NAMES = joinList(COMPANIES.map((c) => c.name), "or");

/** Account-state and failure banners. Copy is fixed by the product spec. */
type Banner =
  | { tone: "destructive" | "warning" | "info" | "success"; title: string; body?: string; resend?: boolean }
  | null;

function bannerFor(outcome: LoginOutcome): Banner {
  switch (outcome.kind) {
    case "invalid-credentials":
      return { tone: "destructive", title: "Email or password is incorrect." };
    case "pending":
      return {
        tone: "info",
        title: "Your access request is still under review.",
        body: "We’ll email you when a decision is made.",
      };
    case "approved-incomplete":
      return {
        tone: "warning",
        title: "Your access request was approved.",
        body: "Check your email to finish setting up your account.",
        resend: true,
      };
    case "rejected":
      return {
        tone: "destructive",
        title: "Your access request was not approved.",
        body: "Contact your administrator if you believe this is a mistake.",
      };
    case "deactivated":
      return {
        tone: "destructive",
        title: "This account is inactive.",
        body: "Contact your administrator for help.",
      };
    case "rate-limited":
      return {
        tone: "destructive",
        title: `Too many unsuccessful attempts. Try again in ${formatWait(outcome.retryInMs)}, or reset your password.`,
      };
    default:
      return null;
  }
}

const TONE_ICON = {
  destructive: AlertCircle,
  warning: MailWarning,
  info: Info,
  success: CheckCircle2,
} as const;

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, user, ready } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [banner, setBanner] = useState<Banner>(null);
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [resendUntil, setResendUntil] = useState(0);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Prefill from a previous "Remember me" login. Done in an effect rather than
  // a useState initialiser so the server and client first paint match.
  useEffect(() => {
    const saved = rememberedEmail();
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  // Already signed in → go where they were headed.
  const next = params.get("next");
  const safeNext = next && /^\/[^/\\]/.test(next) ? next : "/";
  useEffect(() => {
    if (ready && user) router.replace(safeNext);
  }, [ready, user, router, safeNext]);

  const validate = useCallback(() => {
    const e: { email?: string; password?: string } = {};
    if (!email.trim()) e.email = "Enter your corporate email.";
    else if (!isValidEmailFormat(email)) e.email = "Enter a valid email address.";
    if (!password) e.password = "Enter your password.";
    return e;
  }, [email, password]);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (busy) return; // guards against double submission

    const found = validate();
    setErrors(found);
    if (found.email || found.password) {
      // Move focus to the first invalid field.
      (found.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setBanner(null);
    setBusy(true);
    try {
      const outcome = await login(email, password, remember);
      if (outcome.kind === "ok") {
        router.replace(safeNext);
        return;
      }
      setBanner(bannerFor(outcome));
      if (outcome.kind === "invalid-credentials") {
        setPassword("");
        passwordRef.current?.focus();
      }
    } catch {
      setBanner({
        tone: "destructive",
        title: "We couldn’t log you in.",
        body: "Check your connection and try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    if (resendState === "sending" || Date.now() < resendUntil) return;
    setResendState("sending");
    // Reflects the real send result — an outage is reported, never hidden.
    const outage = isEmailOutage();
    const req = resendActivation(email);
    await new Promise((r) => setTimeout(r, 400));
    if (!req || outage || req.emailFailed) {
      setResendState("failed");
      return;
    }
    setResendState("sent");
    setResendUntil(Date.now() + RESEND_COOLDOWN_MS);
  }

  const Icon = banner ? TONE_ICON[banner.tone] : null;

  return (
    <>
      <AuthHeader
        title="Log in to Rate Management System"
        description="Use your corporate email and password to continue."
        showWelcome
      />

      <div className="flex flex-col gap-5">
        {banner && Icon && (
          <Alert variant={banner.tone}>
            <Icon aria-hidden />
            <AlertTitle>{banner.title}</AlertTitle>
            {banner.body && <AlertDescription>{banner.body}</AlertDescription>}
            {banner.resend && (
              <AlertDescription className="mt-2">
                {resendState === "sent" ? (
                  <span className="text-status-positive-fg">
                    Setup email sent to {normalizeEmail(email)}.
                  </span>
                ) : resendState === "failed" ? (
                  <span className="text-status-negative-fg">
                    We couldn’t send the setup email. Try again shortly.
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onResend}
                    loading={resendState === "sending"}
                    loadingText="Sending…"
                  >
                    Resend setup email
                  </Button>
                )}
              </AlertDescription>
            )}
          </Alert>
        )}

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          <AuthFields>
            <TextField
              ref={emailRef}
              label="Corporate email"
              type="email"
              required
              autoComplete="username"
              autoFocus
              // Figma's exact placeholder — company names read better than
              // raw domains, and the label carries the requirement.
              placeholder={`Enter ${COMPANY_NAMES} email`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              error={errors.email}
            />
            <TextField
              ref={passwordRef}
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
              }}
              error={errors.password}
            />
          </AuthFields>

          <div className="flex flex-col gap-5">
            <Button type="submit" className="w-full" loading={busy} loadingText="Logging in…">
              Log in
            </Button>
            {/* Figma keeps "Forgot password?" below the CTA; Remember me shares
                that row rather than pushing the approved order around. */}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="remember-me"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                  aria-describedby="remember-me-hint"
                />
                <label htmlFor="remember-me" className="text-body text-muted-foreground select-none">
                  Remember me
                </label>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/forgot-password">Forgot password?</Link>
              </Button>
            </div>
            <p className="sr-only" id="remember-me-hint">
              Keeps you logged in on this device after you close the browser. Leave it off on
              shared computers.
            </p>
          </div>
        </form>
      </div>

      <AuthSupportCard>
        <span className="text-body font-bold text-foreground">Don’t have an account?</span>
        <Button asChild variant="ghost" size="sm">
          <Link href="/request-access">Request access</Link>
        </Button>
      </AuthSupportCard>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <AuthHeader
            title="Log in to Rate Management System"
            description="Use your corporate email and password to continue."
          />
        }
      >
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
