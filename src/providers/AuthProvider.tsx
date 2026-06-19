import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { toast } from 'sonner-native';
import { supabase } from '@/shared/utils/supabaseClient';
import { setUserProfile, clearUserProfile } from '@/shared/utils/helper';
import { storage } from '@/shared/utils/storageService';
import type { AppUser } from '@/shared/types/AppUser';
import type { Session } from '@supabase/supabase-js';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: AppUser | null;
  isLogin: boolean;
  loading: boolean;
  showLogin: boolean;
  setShowLogin: (v: boolean) => void;
  handleGoogleLogin: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_SETTINGS = {
  sound: true,
  autoTimer: true,
  darkMode: true,
  shareProgress: true,
  dataCollection: false,
};

function toAppUser(profile: Record<string, unknown>): AppUser {
  return {
    ...(profile as unknown as AppUser),
    bookmark_questions: (profile.bookmark_questions as string[] | null) ?? [],
    college: (profile.college as string | null) ?? '',
    targetYear: (profile.targetYear as number | null) ?? 2027,
    version_number: (profile.version_number as number | null) ?? 1,
    settings: {
      ...DEFAULT_SETTINGS,
      ...((profile.settings as AppUser['settings']) ?? {}),
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const sessionRequestRef = useRef(0);

  const isLogin = !!user && user.id !== '1';

  const handleSession = useCallback(async (session: Session | null) => {
    const requestId = ++sessionRequestRef.current;
    const supaUser = session?.user ?? null;

    if (supaUser && userIdRef.current === supaUser.id) {
      setLoading(false);
      return;
    }

    if (supaUser) {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: supaUser.id,
          email: supaUser.email ?? null,
          name: supaUser.user_metadata.full_name ?? supaUser.user_metadata.name ?? null,
          avatar: supaUser.user_metadata.avatar_url ?? null,
        })
        .select()
        .single();

      if (requestId !== sessionRequestRef.current) return;

      if (error || !data) {
        console.error('[auth] profile sync failed:', error);
        setUser(null);
        clearUserProfile();
        toast.error('Unable to load your account. Please try again.');
      } else {
        const profile = toAppUser(data);
        userIdRef.current = supaUser.id;
        setUserProfile(profile);
        setUser(profile);
      }
    } else {
      userIdRef.current = null;
      setUser(null);
      clearUserProfile();
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[auth] session restore failed:', error);
        setLoading(false);
        return;
      }
      void handleSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        void handleSession(session);
      }, 0);
    });

    return () => listener.subscription.unsubscribe();
  }, [handleSession]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const redirectTo = makeRedirectUri({
        scheme: 'gatequest',
        path: 'auth/callback',
      });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error('Supabase did not return an OAuth URL.');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') {
        setLoading(false);
        return;
      }

      const { params, errorCode } = QueryParams.getQueryParams(result.url);
      if (errorCode) throw new Error(errorCode);

      const accessToken = params.access_token;
      const refreshToken = params.refresh_token;
      if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
        throw new Error('OAuth response did not contain a valid session.');
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) throw sessionError;
    } catch (error) {
      console.error('[auth] Google login failed:', error);
      toast.error('Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[auth] logout failed:', error);
      toast.error('Unable to sign out. Please try again.');
      setLoading(false);
      return;
    }

    await storage.nuke();
    userIdRef.current = null;
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLogin, loading, showLogin, setShowLogin, handleGoogleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
