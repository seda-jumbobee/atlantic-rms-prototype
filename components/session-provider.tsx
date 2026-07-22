"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User } from "@/lib/types";
import { USERS, isCorporateEmail, DEFAULT_MANAGER } from "@/lib/data/users";

const STORAGE_KEY = "rms.session.userId";

interface SessionValue {
  user: User | null;
  ready: boolean;
  login: (email: string) => { ok: boolean; error?: string };
  loginAs: (userId: string) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (id) {
      const u = USERS.find((x) => x.id === id);
      if (u) setUser(u);
    }
    setReady(true);
  }, []);

  const persist = useCallback((u: User | null) => {
    setUser(u);
    if (typeof window !== "undefined") {
      if (u) localStorage.setItem(STORAGE_KEY, u.id);
      else localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = useCallback(
    (email: string) => {
      const e = email.trim().toLowerCase();
      if (!isCorporateEmail(e)) {
        return { ok: false, error: "Use a corporate email (@jumbobee.com, @atlanticprojectcargo.com, @atlanticexpresscorp.com)." };
      }
      const match = USERS.find((u) => u.email.toLowerCase() === e);
      persist(match ?? DEFAULT_MANAGER);
      return { ok: true };
    },
    [persist],
  );

  const loginAs = useCallback((userId: string) => {
    const u = USERS.find((x) => x.id === userId) ?? DEFAULT_MANAGER;
    persist(u);
  }, [persist]);

  const logout = useCallback(() => persist(null), [persist]);

  // Roles come from the (mock) user record — no in-app role switching.
  return (
    <SessionContext.Provider value={{ user, ready, login, loginAs, logout }}>
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
