"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User } from "@/lib/types";
import { USERS } from "@/lib/data/users";
import { attemptLogin, type LoginOutcome } from "@/lib/auth/access-store";
import { getProfile } from "@/lib/auth/profile-store";

const STORAGE_KEY = "rms.session.userId";
/** Accounts created through activation are not in the seeded USERS table. */
const ACTIVATED_KEY = "rms.session.activated";
/** The email to prefill on the login screen, only when "Remember me" was used. */
const REMEMBER_KEY = "rms.session.rememberedEmail";

interface SessionValue {
  user: User | null;
  ready: boolean;
  /**
   * Verifies credentials against real account state and, only on success,
   * establishes the session. Role and identity come from the account record —
   * never from anything the login form can choose.
   *
   * `remember` decides WHERE the session is stored, which is what makes the
   * "Remember me" checkbox mean something:
   *   • true  → localStorage, so the session survives closing the browser
   *   • false → sessionStorage, so it ends when the tab/browser closes
   */
  login: (email: string, password: string, remember?: boolean) => Promise<LoginOutcome>;
  logout: () => void;
  /** Re-read the stored profile overrides after Settings saves one, so the
   *  sidebar reflects a new name or photo without a reload. */
  refreshProfile: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

/** Email remembered by a previous "Remember me" login, for prefill. */
export function rememberedEmail(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? "";
  } catch {
    return "";
  }
}

/**
 * Layer the account's saved profile edits over the record it came from.
 *
 * The override is AUTHORITATIVE for the avatar, not a fallback: merging with
 * `?? u.avatarUrl` would keep resurrecting the previous photo from the
 * already-merged session object, so removing a photo could never take effect.
 */
function withProfile(u: User): User {
  const o = getProfile(u.email);
  const name = o.name || u.name;
  return { ...u, name, initials: initials(name), avatarUrl: o.avatarUrl };
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Build a session user for an account that activated through Request access. */
function activatedUser(email: string, name: string, role: "manager" | "admin"): User {
  return {
    id: `acct-${email}`,
    name,
    email,
    role,
    title: role === "admin" ? "Administrator" : "Sales Manager",
    initials: initials(name),
    avatarColor: "#232572",
  };
}

/** Reads a key from localStorage first, then sessionStorage. */
function readEither(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      setReady(true);
      return;
    }
    const id = readEither(STORAGE_KEY);
    if (id) {
      const seeded = USERS.find((x) => x.id === id);
      if (seeded) {
        setUser(withProfile(seeded));
      } else {
        // Restore an activated (non-seeded) account.
        try {
          const raw = readEither(ACTIVATED_KEY);
          if (raw) {
            const u = JSON.parse(raw) as User;
            if (u?.id === id) setUser(withProfile(u));
          }
        } catch {
          /* corrupt payload — stay logged out */
        }
      }
    }
    setReady(true);
  }, []);

  const persist = useCallback((u: User | null, remember = false) => {
    setUser(u);
    if (typeof window === "undefined") return;
    try {
      if (!u) {
        // Clear the session from BOTH stores; the remembered email is kept so
        // the next login is still prefilled.
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ACTIVATED_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(ACTIVATED_KEY);
        return;
      }

      const store = remember ? localStorage : sessionStorage;
      const other = remember ? sessionStorage : localStorage;
      // Never leave a stale copy in the store we are not using — otherwise an
      // un-remembered login would still be restored after a browser restart.
      other.removeItem(STORAGE_KEY);
      other.removeItem(ACTIVATED_KEY);

      store.setItem(STORAGE_KEY, u.id);
      if (USERS.some((x) => x.id === u.id)) store.removeItem(ACTIVATED_KEY);
      else store.setItem(ACTIVATED_KEY, JSON.stringify(u));

      if (remember) localStorage.setItem(REMEMBER_KEY, u.email);
      else localStorage.removeItem(REMEMBER_KEY);
    } catch {
      /* storage unavailable (private mode / blocked) — session stays in memory */
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string, remember = false): Promise<LoginOutcome> => {
      const outcome = await attemptLogin(email, password);
      if (outcome.kind !== "ok") return outcome;
      const seeded = USERS.find((u) => u.email.toLowerCase() === outcome.email);
      const base = seeded ?? activatedUser(outcome.email, outcome.name, outcome.role);
      persist(withProfile(base), remember);
      return outcome;
    },
    [persist],
  );

  const logout = useCallback(() => persist(null), [persist]);

  const refreshProfile = useCallback(() => {
    setUser((u) => (u ? withProfile(u) : u));
  }, []);

  // Roles come from the account record — there is no in-app role switching and
  // no way for the login screen to pick one.
  return (
    <SessionContext.Provider value={{ user, ready, login, logout, refreshProfile }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

export function useIsAdmin(): boolean {
  const { user } = useSession();
  return user?.role === "admin";
}
