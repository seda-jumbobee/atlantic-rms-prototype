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

interface StoreShape {
  requests: AccessRequest[];
  emails: DevEmail[];
  resets: Record<string, SimToken>; // email → reset token
}

const KEY = "rms.auth.store.v1";
const now = () => Date.now();
const iso = () => new Date().toISOString();
const makeToken = () => `${now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

function seed(): StoreShape {
  // Map the existing mock pending registrations into the new request model.
  const requests: AccessRequest[] = PENDING_REGISTRATIONS.map((r, i) => ({
    id: r.id,
    name: r.name,
    email: normalizeEmail(r.email),
    companyId: COMPANIES.find((c) => c.name === r.company)?.id ?? "apc",
    status: "pending" as AccessStatus,
    submittedAt: r.requestedAt,
    note: undefined,
    // a couple of illustrative pre-existing states so admins/login have data to act on
    ...(i === 2 ? {} : {}),
  }));
  return { requests, emails: [], resets: {} };
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
    return JSON.parse(raw) as StoreShape;
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
  r.emailFailed = false;
  logEmail(s, {
    to: r.email, template: "approved",
    subject: "Your Atlantic RMS access is approved",
    data: {
      firstName: firstName(r.name), companyName: companyById(r.companyId)?.name ?? "",
      link: activationLink(r.activation.token),
    },
  });
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
  logEmail(s, {
    to: r.email, template: "resend-setup",
    subject: "Your Atlantic RMS access is approved",
    data: {
      firstName: firstName(r.name), companyName: companyById(r.companyId)?.name ?? "",
      link: activationLink(r.activation.token),
    },
  });
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

function logEmail(s: StoreShape, e: Omit<DevEmail, "id" | "createdAt">) {
  s.emails = [{ id: `em-${makeToken()}`, createdAt: iso(), ...e }, ...s.emails].slice(0, 50);
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
