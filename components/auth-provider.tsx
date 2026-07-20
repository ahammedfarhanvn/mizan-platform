"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { hasSupabase, supabase } from "../lib/supabase";

export type MizanProfile = {
  fullName: string;
  madhhab: string;
  language: string;
  region: string;
  role: string;
  onboardingComplete: boolean;
};

type AuthState = {
  user: User | { id: string; email?: string } | null;
  profile: MizanProfile;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<MizanProfile>) => Promise<void>;
};

const defaultProfile: MizanProfile = {
  fullName: "MĪZĀN User",
  madhhab: "Shafi'i",
  language: "English",
  region: "Kerala, India",
  role: "Individual",
  onboardingComplete: false,
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const localProfile = window.localStorage.getItem("mizan-profile");
    // Initial hydration from the device-local fallback store.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localProfile) setProfile({ ...defaultProfile, ...JSON.parse(localProfile) });
    if (!supabase) {
      const demo = window.localStorage.getItem("mizan-demo-user");
      if (demo) setUser(JSON.parse(demo));
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(() => ({
    user,
    profile,
    loading,
    configured: hasSupabase,
    async signIn(email, password) {
      if (supabase) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const demo = { id: "demo-user", email };
        window.localStorage.setItem("mizan-demo-user", JSON.stringify(demo));
        setUser(demo);
      }
    },
    async signUp(email, password, fullName) {
      if (supabase) {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
        if (error) throw error;
      } else {
        const demo = { id: "demo-user", email };
        window.localStorage.setItem("mizan-demo-user", JSON.stringify(demo));
        setUser(demo);
      }
      const next = { ...profile, fullName };
      setProfile(next);
      window.localStorage.setItem("mizan-profile", JSON.stringify(next));
    },
    async signOut() {
      if (supabase) await supabase.auth.signOut();
      window.localStorage.removeItem("mizan-demo-user");
      setUser(null);
    },
    async updateProfile(changes) {
      const next = { ...profile, ...changes };
      setProfile(next);
      window.localStorage.setItem("mizan-profile", JSON.stringify(next));
      if (supabase && user) {
        const { error } = await supabase.from("profiles").upsert({
          id: user.id,
          full_name: next.fullName,
          madhhab: next.madhhab.toLowerCase().replaceAll("'", ""),
          preferred_language: next.language,
          region: next.region,
          account_role: next.role,
          onboarding_complete: next.onboardingComplete,
        });
        if (error) throw error;
      }
    },
  }), [user, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
