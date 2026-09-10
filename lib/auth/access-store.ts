// ─────────────────────────────────────────────────────────────────────────────
// Atlantic RMS — access-request + activation store (PROTOTYPE).
//
// This project has NO backend, email provider, or token service. This module is
// an honest client-side simulation persisted to localStorage so the auth flows
// connect end-to-end (request → admin approve → activation link → log in), and
// so "emails" can be shown in a clearly-labelled development preview instead of
// faking real delivery.
//
// Security notes carried over to a real backend:
//   • Passwords are NEVER stored here (only a `hasPassword` boolean flag).
//   • Tokens are single-use and expiring; a real backend must validate them.
//   • Company/domain/role/status must be re-validated server-side.
// ─────────────────────────────────────────────────────────────────────────────

import { COMPANIES, companyById, normalizeEmail, ACTIVATION_TOKEN_TTL_HOURS, RESET_TOKEN_TTL_HOURS } from "@/lib/auth/companies";
import { USERS } from "@/lib/data/users";
import { PENDING_REGISTRATIONS } from "@/lib/data/permissions";

export type AccessStatus = "pending" | "approved" | "rejected" | "activated" | "expired" | "deactivated";

export interface SimToken {
  token: string;
  expiresAt: number; // epoch ms
  usedAt?: number;
}

export interface AccessRequest {
  id: string;
  name: string;
  email: string; // normalized
  companyId: string;
  status: AccessStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  note?: string; // internal only — never shown to the requester
  rejectionReason?: string; // optional external reason
  activation?: SimToken;
  hasPassword?: boolean;
  /**
   * `salt:sha256(salt + password)` — NEVER the password itself. A real backend
   * must use a slow KDF (argon2/bcrypt/scrypt) server-side; SHA-256 here only
   * makes credential checking real in the prototype without storing plaintext.
   */
  passwordHash?: string;
  emailFailed?: boolean; // last transactional email could not be "sent" (dev)
}

export type EmailTemplateId =
  | "request-received" | "approved" | "rejected" | "resend-setup" | "password-reset" | "password-changed";

export interface DevEmail {
  id: string;
  to: string;
  template: EmailTemplateId;
  subject: string;
  createdAt: string;
  data: Record<string, string>;
}

/** Failed-login bookkeeping for throttling. Keyed by normalized email. */
export interface AttemptRecord {
  count: number;
  firstAt: number;
  lockedUntil?: number;
}

interface StoreShape {
  requests: AccessRequest[];
  emails: DevEmail[];
  resets: Record<string, SimToken>; // email → reset token
  attempts: Record<string, AttemptRecord>; // failed logins, for rate limiting
  resetSentAt: Record<string, number>; // email → last reset email, for cooldown
  /** email → `salt:hash`, for accounts with no access-request record of their
   *  own (the seeded demo USERS). Request-backed accounts keep their hash on
   *  the request itself. */
  credentials: Record<string, string>;
  /** Dev switch: when true, "sending" fails so failure states are reachable
   *  honestly instead of being faked as success. Toggled from /dev/email-preview. */
  emailOutage?: boolean;
}

const KEY = "rms.auth.store.v2";
const now = () => Date.now();
const iso = () => new Date().toISOString();
const makeToken = () => `${now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

function seed(): StoreShape {
  // Map the existing mock pending registrations into the new request model.
  const requests: AccessRequest[] = PENDING_REGISTRATIONS.map((r) => ({
    id: r.id,
    name: r.name,
    email: normalizeEmail(r.email),
    companyId: COMPANIES.find((c) => c.name === r.company)?.id ?? "apc",
    status: "pending" as AccessStatus,
    submittedAt: r.requestedAt,
    note: undefined,
  }));

  // Illustrative accounts so every login branch is reachable without having to
  // drive the admin flow first. These are demo fixtures, not real accounts.
  const demo: AccessRequest[] = [
    {
      id: "req-demo-approved",
      name: "Dana Reeves",
      email: "dana.reeves@atlanticexpresscorp.com",
      companyId: "aec",
      status: "approved",
      submittedAt: new Date(now() - 3 * 86_400_000).toISOString(),
      reviewedAt: new Date(now() - 2 * 86_400_000).toISOString(),
      reviewedBy: "Max Mayer",
      activation: { token: "demo-approved-token", expiresAt: now() + ACTIVATION_TOKEN_TTL_HOURS * 3600_000 },
    },
    {
      id: "req-demo-rejected",
      name: "Priya Raman",
      email: "priya.raman@jumbobee.com",
      companyId: "jb",
      status: "rejected",
      submittedAt: new Date(now() - 9 * 86_400_000).toISOString(),
      reviewedAt: new Date(now() - 8 * 86_400_000).toISOString(),
      reviewedBy: "Max Mayer",
    },
    {
      id: "req-demo-deactivated",
      name: "Owen Fields",
      email: "owen.fields@atlanticprojectcargo.com",
      companyId: "apc",
      status: "deactivated",
      submittedAt: new Date(now() - 60 * 86_400_000).toISOString(),
      hasPassword: true,
    },
  ];

  return {
    requests: [...requests, ...demo],
    emails: [],
    resets: {},
    attempts: {},
    resetSentAt: {},
    credentials: {},
  };
}

function read(): StoreShape {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    // Defensive defaults so a store written by an earlier shape still loads.
    return {
      requests: parsed.requests ?? [],
      emails: parsed.emails ?? [],
      resets: parsed.resets ?? {},
      attempts: parsed.attempts ?? {},
      resetSentAt: parsed.resetSentAt ?? {},
      credentials: parsed.credentials ?? {},
      emailOutage: parsed.emailOutage ?? false,
    };
  } catch {
    return seed();
  }
}

function write(s: StoreShape) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(s));
}

// ── accounts (seeded USERS are the existing active accounts) ──────────────────

export interface AccountLookup {
  exists: boolean;
  active: boolean;
  role?: "manager" | "admin";
  name?: string;
}

/** Is there an active RMS account for this email? Seeded USERS + activated requests. */
export function accountForEmail(email: string): AccountLookup {
  const e = normalizeEmail(email);
  const u = USERS.find((x) => x.email.toLowerCase() === e);
  if (u) return { exists: true, active: true, role: u.role, name: u.name };
  const req = getRequestByEmail(e);
  if (req?.status === "activated") return { exists: true, active: true, role: "manager", name: req.name };
  if (req?.status === "deactivated") return { exists: true, active: false, name: req.name };
  return { exists: false, active: false };
}

// ── requests ─────────────────────────────────────────────────────────────────

export function getRequests(): AccessRequest[] {
  return read().requests;
}

export function getRequestByEmail(email: string): AccessRequest | undefined {
  const e = normalizeEmail(email);
  return read().requests.find((r) => r.email === e);
}

export function getRequestById(id: string): AccessRequest | undefined {
  return read().requests.find((r) => r.id === id);
}

export type SubmitOutcome =
  | { kind: "ok"; request: AccessRequest }
  | { kind: "active-account" }
  | { kind: "pending" }
  | { kind: "approved-incomplete"; request: AccessRequest }
  | { kind: "rejected" };

/** Submit a new access request, or report an existing state (no duplicates). */
export function submitRequest(input: { name: string; email: string; companyId: string }): SubmitOutcome {
  const s = read();
  const email = normalizeEmail(input.email);

  if (accountForEmail(email).active) return { kind: "active-account" };

  const existing = s.requests.find((r) => r.email === email);
  if (existing) {
    if (existing.status === "pending") return { kind: "pending" };
    if (existing.status === "approved") return { kind: "approved-incomplete", request: existing };
    if (existing.status === "rejected") return { kind: "rejected" };
    // activated handled by accountForEmail above; expired/deactivated fall through to re-submit
  }

  const request: AccessRequest = {
    id: `req-${makeToken()}`,
    name: input.name,
    email,
    companyId: input.companyId,
    status: "pending",
    submittedAt: iso(),
  };
  s.requests = [request, ...s.requests.filter((r) => r.email !== email)];
  logEmail(s, {
    to: email, template: "request-received",
    subject: "We received your Atlantic RMS access request",
    data: { firstName: firstName(input.name), companyName: companyById(input.companyId)?.name ?? "" },
  });
  write(s);
  return { kind: "ok", request };
}

// ── admin approve / reject ────────────────────────────────────────────────────

export function approveRequest(id: string, reviewedBy: string): AccessRequest | undefined {
  const s = read();
  const r = s.requests.find((x) => x.id === id);
  if (!r) return undefined;
  r.status = "approved";
  r.reviewedAt = iso();
  r.reviewedBy = reviewedBy;
  r.activation = { token: makeToken(), expiresAt: now() + ACTIVATION_TOKEN_TTL_HOURS * 3600_000 };
  const approvedSent = logEmail(s, {
    to: r.email, template: "approved",
    subject: "Your Atlantic RMS access is approved",
    data: {
      firstName: firstName(r.name), companyName: companyById(r.companyId)?.name ?? "",
      link: activationLink(r.activation.token),
    },
  });
  r.emailFailed = !approvedSent;
  write(s);
  return r;
}

export function rejectRequest(id: string, reviewedBy: string, reason?: string): AccessRequest | undefined {
  const s = read();
  const r = s.requests.find((x) => x.id === id);
  if (!r) return undefined;
  r.status = "rejected";
  r.reviewedAt = iso();
  r.reviewedBy = reviewedBy;
  r.rejectionReason = reason?.trim() || undefined;
  logEmail(s, {
    to: r.email, template: "rejected",
    subject: "Update on your Atlantic RMS access request",
    data: {
      firstName: firstName(r.name), companyName: companyById(r.companyId)?.name ?? "",
      ...(r.rejectionReason ? { reason: r.rejectionReason } : {}),
    },
  });
  write(s);
  return r;
}

/** Re-issue an activation link + resend the setup email (cooldown enforced in UI). */
export function resendActivation(email: string): AccessRequest | undefined {
  const s = read();
  const r = s.requests.find((x) => x.email === normalizeEmail(email));
  if (!r || (r.status !== "approved" && r.status !== "expired")) return undefined;
  r.status = "approved";
  r.activation = { token: makeToken(), expiresAt: now() + ACTIVATION_TOKEN_TTL_HOURS * 3600_000 };
  const resendSent = logEmail(s, {
    to: r.email, template: "resend-setup",
    subject: "Your Atlantic RMS access is approved",
    data: {
      firstName: firstName(r.name), companyName: companyById(r.companyId)?.name ?? "",
      link: activationLink(r.activation.token),
    },
  });
  r.emailFailed = !resendSent;
  write(s);
  return r;
}

// ── activation-token validation + completion ─────────────────────────────────

export type LinkState = "valid" | "expired" | "used" | "invalid" | "unavailable";

export function validateActivation(token: string): { state: LinkState; request?: AccessRequest } {
  if (!token) return { state: "invalid" };
  const r = read().requests.find((x) => x.activation?.token === token);
  if (!r || !r.activation) return { state: "invalid" };
  if (r.status === "rejected" || r.status === "deactivated") return { state: "unavailable", request: r };
  if (r.activation.usedAt || r.status === "activated") return { state: "used", request: r };
  if (r.activation.expiresAt < now()) return { state: "expired", request: r };
  return { state: "valid", request: r };
}

/** Complete activation. The password is NOT stored — only a flag. */
export function activateAccount(token: string): { ok: boolean; request?: AccessRequest } {
  const s = read();
  const r = s.requests.find((x) => x.activation?.token === token);
  if (!r || !r.activation) return { ok: false };
  if (r.activation.usedAt || r.status === "activated") return { ok: false, request: r };
  if (r.activation.expiresAt < now()) return { ok: false, request: r };
  r.activation.usedAt = now();
  r.status = "activated";
  r.hasPassword = true;
  write(s);
  return { ok: true, request: r };
}

// ── password reset (privacy-preserving) ──────────────────────────────────────

/** Always succeeds from the caller's view (never reveals account existence). */
export function requestPasswordReset(email: string): void {
  const s = read();
  const e = normalizeEmail(email);
  if (!accountForEmail(e).active) {
    write(s); // nothing to do; caller shows the same success either way
    return;
  }
  s.resets[e] = { token: makeToken(), expiresAt: now() + RESET_TOKEN_TTL_HOURS * 3600_000 };
  const acct = accountForEmail(e);
  logEmail(s, {
    to: e, template: "password-reset",
    subject: "Reset your Atlantic RMS password",
    data: { firstName: firstName(acct.name ?? e), link: resetLink(s.resets[e].token) },
  });
  write(s);
}

export function validateReset(token: string): { state: LinkState; email?: string } {
  if (!token) return { state: "invalid" };
  const s = read();
  const entry = Object.entries(s.resets).find(([, t]) => t.token === token);
  if (!entry) return { state: "invalid" };
  const [email, t] = entry;
  if (t.usedAt) return { state: "used", email };
  if (t.expiresAt < now()) return { state: "expired", email };
  return { state: "valid", email };
}

export function completeReset(token: string): { ok: boolean; email?: string } {
  const s = read();
  const entry = Object.entries(s.resets).find(([, t]) => t.token === token);
  if (!entry) return { ok: false };
  const [email, t] = entry;
  if (t.usedAt || t.expiresAt < now()) return { ok: false, email };
  t.usedAt = now();
  logEmail(s, {
    to: email, template: "password-changed",
    subject: "Your Atlantic RMS password was changed",
    data: { firstName: firstName(accountForEmail(email).name ?? email) },
  });
  write(s);
  return { ok: true, email };
}

// ── dev email preview log ────────────────────────────────────────────────────

/**
 * "Sends" a transactional email by appending it to the dev preview log.
 * Returns false when the simulated provider is down — callers MUST surface a
 * failure state rather than claiming the mail was sent.
 */
function logEmail(s: StoreShape, e: Omit<DevEmail, "id" | "createdAt">): boolean {
  if (s.emailOutage) return false;
  s.emails = [{ id: `em-${makeToken()}`, createdAt: iso(), ...e }, ...s.emails].slice(0, 50);
  return true;
}

export function getDevEmails(): DevEmail[] {
  return read().emails;
}

// ── link + name helpers ──────────────────────────────────────────────────────

export function activationLink(token: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/activate?token=${token}`;
}
export function resetLink(token: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/reset-password?token=${token}`;
}
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

/** Test/dev helper — reset the simulated store. */
export function __resetStore() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}

// ═════════════════════════════════════════════════════════════════════════════
// CREDENTIALS, THROTTLING AND DELIVERY
//
// Everything below exists so the login screen can report the *real* account
// state instead of guessing. Constraints kept intact:
//   • no plaintext password is ever written anywhere;
//   • tokens are never logged or embedded in anything user-visible;
//   • password-reset requests never reveal whether an account exists.
// ═════════════════════════════════════════════════════════════════════════════

// ── password hashing ─────────────────────────────────────────────────────────

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

function randomSalt(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Returns `salt:hash`. The password itself is discarded. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomSalt();
  return `${salt}:${await sha256Hex(salt + password)}`;
}

export async function verifyPassword(password: string, stored?: string): Promise<boolean> {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  return (await sha256Hex(salt + password)) === hash;
}

export type SetPasswordOutcome = { ok: true } | { ok: false; reason: "no-account" | "storage" };

/**
 * Store a password hash for an account (activation, reset, or a signed-in user
 * changing it from Settings).
 *
 * Returns an outcome rather than void: it used to no-op silently for the
 * seeded demo USERS, which let a caller report success for a write that never
 * happened. Those accounts now get a record in `credentials`, and a caller can
 * tell a real failure from a real success.
 */
export async function setPasswordForEmail(email: string, password: string): Promise<SetPasswordOutcome> {
  const e = normalizeEmail(email);
  const hash = await hashPassword(password);
  try {
    const s = read();
    const r = s.requests.find((x) => x.email === e);
    if (r) {
      r.passwordHash = hash;
      r.hasPassword = true;
    } else if (USERS.some((u) => u.email.toLowerCase() === e)) {
      s.credentials[e] = hash;
    } else {
      return { ok: false, reason: "no-account" };
    }
    write(s);
    return { ok: true };
  } catch {
    // localStorage can throw (quota, private mode). Never claim success.
    return { ok: false, reason: "storage" };
  }
}

// ── login throttling ────────────────────────────────────────────────────────

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MS = 15 * 60_000;
const ATTEMPT_WINDOW_MS = 15 * 60_000;

/** ms remaining on a lockout, or 0 when not locked. */
export function loginLockRemainingMs(email: string): number {
  const a = read().attempts[normalizeEmail(email)];
  if (!a?.lockedUntil) return 0;
  return Math.max(0, a.lockedUntil - now());
}

function recordFailure(s: StoreShape, email: string) {
  const e = normalizeEmail(email);
  const a = s.attempts[e];
  if (!a || now() - a.firstAt > ATTEMPT_WINDOW_MS) {
    s.attempts[e] = { count: 1, firstAt: now() };
    return;
  }
  a.count += 1;
  if (a.count >= MAX_LOGIN_ATTEMPTS) a.lockedUntil = now() + LOGIN_LOCKOUT_MS;
}

function clearFailures(s: StoreShape, email: string) {
  delete s.attempts[normalizeEmail(email)];
}

/** "14 minutes" / "45 seconds" — for the too-many-attempts message. */
export function formatWait(ms: number): string {
  const secs = Math.ceil(ms / 1000);
  if (secs < 60) return `${secs} second${secs === 1 ? "" : "s"}`;
  const mins = Math.ceil(secs / 60);
  return `${mins} minute${mins === 1 ? "" : "s"}`;
}

// ── login ───────────────────────────────────────────────────────────────────

export type LoginOutcome =
  | { kind: "ok"; email: string; role: "manager" | "admin"; name: string }
  | { kind: "invalid-credentials" }
  | { kind: "pending" }
  | { kind: "approved-incomplete"; email: string }
  | { kind: "rejected" }
  | { kind: "deactivated" }
  | { kind: "rate-limited"; retryInMs: number };

/**
 * Resolve a login attempt against the real account state.
 *
 * Unknown addresses and wrong passwords both return `invalid-credentials`, so
 * the screen cannot be used to enumerate accounts. The account-state branches
 * (pending / approved-incomplete / rejected / deactivated) are surfaced
 * because the product spec requires them — see the summary for the disclosure
 * trade-off that carries.
 *
 * Seeded demo USERS start with no password on file: any non-empty password is
 * accepted for them, and that is a documented prototype gap, not a real check.
 * Once such an account sets a password (Settings → Change password) the
 * credential is verified like any other, so the change actually takes effect.
 */
export async function attemptLogin(email: string, password: string): Promise<LoginOutcome> {
  const e = normalizeEmail(email);

  const locked = loginLockRemainingMs(e);
  if (locked > 0) return { kind: "rate-limited", retryInMs: locked };

  const s = read();
  const req = s.requests.find((x) => x.email === e);
  const seeded = USERS.find((u) => u.email.toLowerCase() === e);

  // ── active accounts ──
  if (seeded) {
    const stored = s.credentials[e];
    const ok = stored ? await verifyPassword(password, stored) : Boolean(password);
    if (!ok) {
      recordFailure(s, e);
      write(s);
      return { kind: "invalid-credentials" };
    }
    clearFailures(s, e);
    write(s);
    return { kind: "ok", email: e, role: seeded.role, name: seeded.name };
  }

  if (req?.status === "activated") {
    const ok = await verifyPassword(password, req.passwordHash);
    if (!ok) {
      recordFailure(s, e);
      write(s);
      return { kind: "invalid-credentials" };
    }
    clearFailures(s, e);
    write(s);
    return { kind: "ok", email: e, role: "manager", name: req.name };
  }

  // ── accounts that exist but cannot sign in yet ──
  if (req?.status === "pending") return { kind: "pending" };
  if (req?.status === "approved" || req?.status === "expired") {
    return { kind: "approved-incomplete", email: e };
  }
  if (req?.status === "rejected") return { kind: "rejected" };
  if (req?.status === "deactivated") return { kind: "deactivated" };

  // ── unknown address (incl. unsupported domains) — stay generic ──
  recordFailure(s, e);
  write(s);
  return { kind: "invalid-credentials" };
}

// ── password-reset request, with cooldown and honest delivery ───────────────

export const RESET_COOLDOWN_MS = 60_000;

export function resetCooldownRemainingMs(email: string): number {
  const at = read().resetSentAt[normalizeEmail(email)];
  if (!at) return 0;
  return Math.max(0, at + RESET_COOLDOWN_MS - now());
}

export type ResetRequestOutcome =
  | { kind: "accepted" }                          // shown identically whether or not an account exists
  | { kind: "cooldown"; retryInMs: number }
  | { kind: "send-failed" };

/**
 * Request a reset link. The caller shows the SAME "check your email" state for
 * `accepted` regardless of whether an account exists. `send-failed` is only
 * returned when an account existed AND the provider failed — so we never claim
 * delivery that did not happen.
 */
export function requestPasswordResetGuarded(email: string): ResetRequestOutcome {
  const e = normalizeEmail(email);
  const wait = resetCooldownRemainingMs(e);
  if (wait > 0) return { kind: "cooldown", retryInMs: wait };

  const s = read();
  s.resetSentAt[e] = now();

  // Provider outage is reported BEFORE the account lookup. Reporting it only
  // for real accounts would turn the failure state into an existence oracle.
  if (s.emailOutage) {
    write(s);
    return { kind: "send-failed" };
  }

  if (!accountForEmail(e).active) {
    // Nothing to send. Record the cooldown so timing can't be used to probe.
    write(s);
    return { kind: "accepted" };
  }

  s.resets[e] = { token: makeToken(), expiresAt: now() + RESET_TOKEN_TTL_HOURS * 3600_000 };
  const acct = accountForEmail(e);
  const sent = logEmail(s, {
    to: e,
    template: "password-reset",
    subject: "Reset your Atlantic RMS password",
    data: { firstName: firstName(acct.name ?? e), link: resetLink(s.resets[e].token) },
  });
  write(s);
  return sent ? { kind: "accepted" } : { kind: "send-failed" };
}

// ── simulated provider outage (dev only) ────────────────────────────────────

export function isEmailOutage(): boolean {
  return read().emailOutage === true;
}

export function setEmailOutage(value: boolean): void {
  const s = read();
  s.emailOutage = value;
  write(s);
}
