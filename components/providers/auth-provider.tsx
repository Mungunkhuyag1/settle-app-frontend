"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getCurrentUser, signIn, signUp, type Session, type User } from "@/lib/api";

const STORAGE_KEY = "settle-session";

type AuthContextValue = {
  initialized: boolean;
  session: Session | null;
  signInWithPassword: (payload: { email: string; password: string }) => Promise<void>;
  signUpWithPassword: (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  signOut: () => void;
  refreshUser: () => Promise<User | null>;
  updateSessionUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Session;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function persistSession(session: Session | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readStoredSession());
  const [initialized, setInitialized] = useState(() => {
    return readStoredSession() === null;
  });
  const accessToken = session?.accessToken;

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    getCurrentUser(accessToken)
      .then((user) => {
        setSession((current) => {
          if (!current || current.accessToken !== accessToken) {
            return current;
          }

          const nextSession = { ...current, user };
          persistSession(nextSession);
          return nextSession;
        });
      })
      .catch(() => {
        setSession(null);
        persistSession(null);
      })
      .finally(() => {
        setInitialized(true);
      });
  }, [accessToken]);

  useEffect(() => {
    function handleUnauthorized() {
      setSession(null);
      persistSession(null);
      setInitialized(true);
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      initialized,
      session,
      async signInWithPassword(payload) {
        const nextSession = await signIn(payload);
        setSession(nextSession);
        persistSession(nextSession);
      },
      async signUpWithPassword(payload) {
        const nextSession = await signUp(payload);
        setSession(nextSession);
        persistSession(nextSession);
      },
      signOut() {
        setSession(null);
        persistSession(null);
        setInitialized(true);
      },
      async refreshUser() {
        if (!session) {
          return null;
        }

        const user = await getCurrentUser(session.accessToken);
        const nextSession = { ...session, user };
        setSession(nextSession);
        persistSession(nextSession);
        return user;
      },
      updateSessionUser(user) {
        if (!session) {
          return;
        }

        const nextSession = { ...session, user };
        setSession(nextSession);
        persistSession(nextSession);
      },
    }),
    [initialized, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
