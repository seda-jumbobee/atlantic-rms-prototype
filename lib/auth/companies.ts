// ─────────────────────────────────────────────────────────────────────────────
// Atlantic RMS — centralized company / corporate-domain configuration.
//
// Single source of truth for the supported companies and their email domains.
// Every auth surface (login, request access, activation, admin) imports from here
// instead of hardcoding the values, so the closed-registration rules stay
// consistent. Frontend validation here is for UX only — a real backend must
// re-validate the domain, company match, request status, and role.
// ─────────────────────────────────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  domain: string; // the ONE corporate domain that maps to this company
}

export const COMPANIES: Company[] = [
  { id: "apc", name: "Atlantic Project Cargo", domain: "atlanticprojectcargo.com" },
  { id: "jb", name: "JumboBee", domain: "jumbobee.com" },
  { id: "aec", name: "Atlantic Express Corp", domain: "atlanticexpresscorp.com" },
];

export const APPROVED_DOMAINS = COMPANIES.map((c) => c.domain);

/** Join a list into prose: ["a","b","c"] → "a, b, and c" / "a, b, or c". */
export function joinList(items: string[], conj: "and" | "or" = "and"): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")}, ${conj} ${items[items.length - 1]}`;
}

/** Human list of approved domains for helper copy. */
export function approvedDomainsSentence(withAt = false, conj: "and" | "or" = "and"): string {
  return joinList(APPROVED_DOMAINS.map((d) => (withAt ? `@${d}` : d)), conj);
}

// ── email parsing / validation ───────────────────────────────────────────────

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Deliberately simple, permissive-but-safe shape check. The domain part is
// validated more strictly below (exact match against APPROVED_DOMAINS).
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_SHAPE.test(normalizeEmail(email));
}

/** The domain after the last "@", or null if the address is malformed. */
export function emailDomain(email: string): string | null {
  const e = normalizeEmail(email);
  if (!EMAIL_SHAPE.test(e)) return null;
  const at = e.lastIndexOf("@");
  const domain = e.slice(at + 1);
  // domain must be a plain label.tld chain — no spaces, no trailing dot
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)) return null;
  return domain;
}

/**
 * Resolve the company for a corporate email by EXACT full-domain match.
 * Exact matching rejects look-alikes and spoofing:
 *   name@jumbobee.com            → JumboBee
 *   name@jumbobee.com.example.com → null (domain is example.com's subdomain)
 *   name@sub.jumbobee.com        → null (subdomains are not approved)
 *   name@notjumbobee.com         → null
 */
export function companyForEmail(email: string): Company | null {
  const domain = emailDomain(email);
  if (!domain) return null;
  return COMPANIES.find((c) => c.domain === domain) ?? null;
}

export function companyById(id?: string): Company | null {
  return COMPANIES.find((c) => c.id === id) ?? null;
}

export function isSupportedEmail(email: string): boolean {
  return companyForEmail(email) !== null;
}

// ── password policy (documented baseline — no backend policy exists) ──────────

export const PASSWORD_MIN_LENGTH = 12;

/** A handful of patterns that are long but still trivially guessable. */
const COMMON_SEQUENCES = [
  "password", "passw0rd", "qwerty", "asdfgh", "zxcvbn", "letmein",
  "welcome", "admin", "atlantic", "jumbobee", "ratemanagement",
  "123456", "1234567890", "abcdef", "iloveyou", "changeme",
];

/**
 * Rejects passwords that clear the length bar but carry almost no entropy:
 * one repeated character, a straight run up or down the keyboard/alphabet,
 * a known common string, or the user's own email local-part.
 */
export function isWeakPassword(pw: string, email?: string): boolean {
  const p = pw.toLowerCase();
  if (/^(.)\1+$/.test(p)) return true; // "aaaaaaaaaaaa"
  if (COMMON_SEQUENCES.some((s) => p.includes(s))) return true;
  if (email) {
    const local = normalizeEmail(email).split("@")[0];
    if (local && local.length >= 4 && p.includes(local)) return true;
  }
  // A monotonic run over most of the password (e.g. "abcdefghijkl", "9876543210…")
  let asc = 1;
  let desc = 1;
  for (let i = 1; i < p.length; i++) {
    const d = p.charCodeAt(i) - p.charCodeAt(i - 1);
    asc = d === 1 ? asc + 1 : 1;
    desc = d === -1 ? desc + 1 : 1;
    if (asc >= p.length - 1 || desc >= p.length - 1) return true;
  }
  return false;
}

/** UX-side password check. A real backend must enforce its own policy + hashing. */
export function passwordError(pw: string, email?: string): string | null {
  if (!pw) return "Enter a password.";
  if (pw.length < PASSWORD_MIN_LENGTH) return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (isWeakPassword(pw, email)) return "Choose a stronger password.";
  return null;
}

/** Second field of a create/confirm pair. */
export function confirmPasswordError(pw: string, confirm: string): string | null {
  if (!confirm) return "Confirm your password.";
  if (pw !== confirm) return "Passwords do not match.";
  return null;
}

export const PASSWORD_HINT = `Use at least ${PASSWORD_MIN_LENGTH} characters and choose a password you don’t use elsewhere.`;

// ── token expiration policy (secure, documented defaults; configurable) ───────
// No token library exists in this prototype, so links are simulated client-side
// (see lib/auth/access-store.ts). These are the policy values a real backend
// should honor.

export const ACTIVATION_TOKEN_TTL_HOURS = 72;
export const RESET_TOKEN_TTL_HOURS = 1;

export function expiryLabel(hours: number): string {
  if (hours % 24 === 0) {
    const d = hours / 24;
    return d === 1 ? "24 hours" : `${d} days`;
  }
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

// ── full-name validation ─────────────────────────────────────────────────────

/** Collapse internal runs of whitespace and trim ends; preserves intl characters. */
export function cleanName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

/** Requires two "words" of letters (any script), allowing hyphens & apostrophes. */
export function fullNameError(raw: string): string | null {
  const name = cleanName(raw);
  if (!name) return "Enter your full name.";
  // \p{L} = any letter in any script; require at least two name parts
  const ok = /^[\p{L}][\p{L}'’-]*(\s[\p{L}][\p{L}'’-]*)+$/u.test(name);
  if (!ok) return "Enter your full name as it should appear in Atlantic RMS.";
  return null;
}
