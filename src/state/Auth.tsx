import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

const AuthContext = createContext<{ session: Session | null; loading: boolean }>({ session: null, loading: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ session: null as Session | null, loading: Boolean(supabase) });
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, loading: false });
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
