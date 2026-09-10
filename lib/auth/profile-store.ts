/* ============================================================================
   Profile overrides — display name and avatar for the signed-in account.

   THERE IS NO SERVER IN THIS PROTOTYPE. Accounts, credentials and now profile
   fields all live in the browser, exactly as lib/auth/access-store.ts does.
   This is a stand-in for a real `PATCH /me` endpoint, not a substitute for
   one: nothing here is shared between devices or between browsers, and a real
   backend must own validation, storage and authorization.

   Kept in its own key rather than bolted onto the auth store so that clearing
   credentials and clearing profile data stay independent operations.
   ========================================================================= */

import { normalizeEmail } from "@/lib/auth/companies";

const KEY = "rms.profile.v1";

export interface ProfileOverride {
  /** Present only when the user has edited it. */
  name?: string;
  /** A square data URL produced by lib/image.ts, never the raw upload. */
  avatarUrl?: string;
}

export type ProfileWrite = { ok: true } | { ok: false; reason: "storage" | "quota" };

type Shape = Record<string, ProfileOverride>;

function read(): Shape {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? ((JSON.parse(raw) as Shape) ?? {}) : {};
  } catch {
    return {};
  }
}

function write(s: Shape): ProfileWrite {
  if (typeof window === "undefined") return { ok: false, reason: "storage" };
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return { ok: true };
  } catch (err) {
    // An avatar can push the origin over its storage budget. That is a real
    // failure and has to reach the user, not be swallowed.
    const quota =
      err instanceof DOMException &&
      (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED");
    return { ok: false, reason: quota ? "quota" : "storage" };
  }
}

export function getProfile(email: string): ProfileOverride {
  return read()[normalizeEmail(email)] ?? {};
}

function patch(email: string, next: ProfileOverride): ProfileWrite {
  const s = read();
  const e = normalizeEmail(email);
  const merged = { ...(s[e] ?? {}), ...next };
  // Drop keys that were explicitly cleared so the record does not grow stale.
  (Object.keys(merged) as (keyof ProfileOverride)[]).forEach((k) => {
    if (merged[k] === undefined) delete merged[k];
  });
  s[e] = merged;
  return write(s);
}

export function setDisplayName(email: string, name: string): ProfileWrite {
  return patch(email, { name: name.trim() });
}

export function setAvatar(email: string, dataUrl: string): ProfileWrite {
  return patch(email, { avatarUrl: dataUrl });
}

export function clearAvatar(email: string): ProfileWrite {
  return patch(email, { avatarUrl: undefined });
}

/* ── display-name validation ────────────────────────────────────────────────
   Deliberately permissive. A name may carry spaces, hyphens, apostrophes and
   any script; the only rules are that it exists and is a sane length. */

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 70;

export function displayNameError(value: string): string | null {
  const v = value.trim();
  if (!v) return "Enter your full name.";
  // Count code points, so a name written in a non-Latin script is not
  // penalised by UTF-16 surrogate pairs.
  const length = [...v].length;
  if (length < NAME_MIN_LENGTH) return `Use at least ${NAME_MIN_LENGTH} characters.`;
  if (length > NAME_MAX_LENGTH) return `Use ${NAME_MAX_LENGTH} characters or fewer.`;
  return null;
}
