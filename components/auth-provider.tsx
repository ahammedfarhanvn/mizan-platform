"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getProfile, hasSupabase, supabase, updateProfileRecord } from "../lib/supabase";
import { displayMadhhab, normalizeMadhhab, type ProfileRecord } from "../lib/models";

export type MizanProfile = {
  fullName: string;
  madhhab: string;
  language: string;
  region: string;
  role: string;
  onboardingComplete: boolean;
  notifications: Record<string, boolean>;
};

type AuthState = {
  user: User | null;
  profile: MizanProfile;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<MizanProfile>) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const defaultNotifications = {
  appointments: true,
  reviews: true,
  reminders: true,
  security: true,
};

const defaultProfile: MizanProfile = {
  fullName: "MĪZĀN User",
  madhhab: "Shafi'i",
  language: "English",
  region: "Kerala, India",
  role: "Individual",
  onboardingComplete: false,
  notifications: defaultNotifications,
};

function mapProfile(record: ProfileRecord | null, user?: User | null): MizanProfile {
  return {
    fullName: record?.full_name || String(user?.user_metadata?.full_name || defaultProfile.fullName),
    madhhab: displayMadhhab(record?.madhhab),
    language: record?.preferred_language || defaultProfile.language,
    region: record?.region || defaultProfile.region,
    role: record?.account_role || defaultProfile.role,
    onboardingComplete: Boolean(record?.onboarding_complete),
    notifications: { ...defaultNotifications, ...(record?.notification_settings || {}) },
  };
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(hasSupabase);

  const hydrateProfile = useCallback(async (nextUser: User | null) => {
    if (!nextUser || !supabase) {
      setProfile(defaultProfile);
      return;
    }
    const record = await getProfile(nextUser.id);
    setProfile(mapProfile(record, nextUser));
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;
      if (error) {
        setLoading(false);
        return;
      }
      const sessionUser = data.session?.user || null;
      setUser(sessionUser);
      try { await hydrateProfile(sessionUser); } finally { if (mounted) setLoading(false); }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user || null;
      setUser(sessionUser);
      void hydrateProfile(sessionUser);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [hydrateProfile]);

  const value = useMemo<AuthState>(() => ({
    user,
    profile,
    loading,
    configured: hasSupabase,
    async signIn(email, password) {
      if (!supabase) throw new Error("The Supabase backend is not configured.");
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      setUser(data.user);
      await hydrateProfile(data.user);
    },
    async signUp(email, password, fullName) {
      if (!supabase) throw new Error("The Supabase backend is not configured.");
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (error) throw error;
      if (!data.user || !data.session) {
        throw new Error("Account confirmation is still enabled in Supabase. Disable Confirm email in Authentication settings, then try again.");
      }
      setUser(data.user);
      await hydrateProfile(data.user);
    },
    async signOut() {
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      setUser(null);
      setProfile(defaultProfile);
    },
    async updateProfile(changes) {
      if (!user) throw new Error("Please sign in to update your profile.");
      const next = { ...profile, ...changes, notifications: { ...profile.notifications, ...(changes.notifications || {}) } };
      const record = await updateProfileRecord({
        full_name: next.fullName,
        madhhab: normalizeMadhhab(next.madhhab),
        preferred_language: next.language,
        region: next.region,
        account_role: next.role,
        onboarding_complete: next.onboardingComplete,
        notification_settings: next.notifications,
      });
      setProfile(mapProfile(record, user));
    },
    async requestPasswordReset(email) {
      if (!supabase) throw new Error("The Supabase backend is not configured.");
      const redirectTo = `${window.location.origin}/settings/`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw error;
    },
    async updatePassword(password) {
      if (!supabase) throw new Error("The Supabase backend is not configured.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    async refreshProfile() {
      await hydrateProfile(user);
    },
  }), [user, profile, loading, hydrateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
