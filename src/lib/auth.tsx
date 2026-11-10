// Session + access check. Works offline: the saved session and a cached "allowed" flag are enough.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { initVanStore, setSyncUser } from "@/lib/vans/store";

type AuthStatus = "loading" | "signedOut" | "checking" | "denied" | "needsNetwork" | "ready";
type AuthState = {
  status: AuthStatus;
  session: Session | null;
  displayName: string;
  email: string;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);
const ALLOWED_KEY = (userId: string) => `fiches-vans:allowed:${userId}`;

function nameOf(session: Session | null): string {
  const meta = (session?.user.user_metadata ?? {}) as Record<string, unknown>;
  const full = (meta.full_name ?? meta.name) as string | undefined;
  if (full) return full.split(" ")[0];
  return session?.user.email?.split("@")[0] ?? "";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let active = true;
    void initVanStore();

    async function evaluate(s: Session | null) {
      if (!active) return;
      setSession(s);
      if (!s) {
        setSyncUser(null);
        setStatus("signedOut");
        return;
      }
      const cached = localStorage.getItem(ALLOWED_KEY(s.user.id)) === "1";
      if (cached) {
        setStatus("ready");
        setSyncUser({ id: s.user.id, name: nameOf(s) });
      } else {
        setStatus(navigator.onLine ? "checking" : "needsNetwork");
      }
      if (!navigator.onLine) return;
      const { data, error } = await supabase.rpc("is_allowed_user");
      if (!active || error) return;
      if (data === true) {
        localStorage.setItem(ALLOWED_KEY(s.user.id), "1");
        setStatus("ready");
        setSyncUser({ id: s.user.id, name: nameOf(s) });
      } else {
        localStorage.removeItem(ALLOWED_KEY(s.user.id));
        setSyncUser(null);
        setStatus("denied");
      }
    }

    void supabase.auth.getSession().then(({ data }) => evaluate(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void evaluate(s);
      else if (s) setSession(s);
    });
    const onOnline = () => void supabase.auth.getSession().then(({ data }) => evaluate(data.session));
    window.addEventListener("online", onOnline);
    return () => {
      active = false;
      sub.subscription.unsubscribe();
      window.removeEventListener("online", onOnline);
    };
  }, []);

  const value: AuthState = {
    status,
    session,
    displayName: nameOf(session),
    email: session?.user.email ?? "",
    signOut: async () => {
      setSyncUser(null);
      await supabase.auth.signOut();
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
