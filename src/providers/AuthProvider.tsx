import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/shared/utils/supabaseClient';
import { setUserProfile, clearUserProfile, getUserProfile } from '@/shared/utils/helper';
import type { AppUser } from '@/shared/types/AppUser';
import type { Session } from '@supabase/supabase-js';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const userIdRef = useRef<string | null>(null);

  const isLogin = !!user && user.id !== '1';

  const handleSession = async (session: Session | null) => {
    const supaUser = session?.user ?? null;
    if (supaUser && userIdRef.current === supaUser.id) {
      setLoading(false);
      return;
    }
    if (supaUser) {
      userIdRef.current = supaUser.id;
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: supaUser.id,
          email: supaUser.email,
          name: supaUser.user_metadata.full_name,
          avatar: supaUser.user_metadata.avatar_url,
          show_name: true,
          total_xp: 0,
          settings: { sound: true, autoTimer: true, darkMode: true },
        })
        .select();
      if (!error && data?.[0]) {
        const profile = {
          ...data[0],
          bookmark_questions: data[0].bookmark_questions || [],
          college: data[0].college || '',
          targetYear: data[0].targetYear || 2027,
          version_number: data[0].version_number || 1,
          settings: { sound: true, autoTimer: true, darkMode: true, ...data[0].settings },
        };
        setUserProfile(profile as AppUser);
        setUser(profile as AppUser);
      }
    } else {
      setUser(null);
      clearUserProfile();
    }
    setLoading(false);
  };

  useEffect(() => {
    // DEV BYPASS: Disable Supabase auth listener to avoid overriding our mock login
    // supabase.auth.getSession().then(({ data: { session } }) => handleSession(session));
    // const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    //   handleSession(session);
    // });
    // return () => listener.subscription.unsubscribe();
    
    // Auto-login on reload if we have a mock profile in storage
    const stored = getUserProfile();
    if (stored && stored.id !== '1') {
      setUser(stored);
    }
    setLoading(false);
  }, []);

  const handleGoogleLogin = async () => {
    // DEV BYPASS: Mock login since Google Auth and Supabase aren't configured yet
    const mockUser: AppUser = {
      id: 'mock-dev-user',
      email: 'dev@gatequest.com',
      name: 'Dev User',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dev',
      show_name: true,
      total_xp: 500,
      bookmark_questions: [],
      college: 'Test College',
      targetYear: 2027,
      version_number: 1,
      settings: { sound: true, autoTimer: true, darkMode: true },
    };
    
    setUserProfile(mockUser);
    setUser(mockUser);
  };

  const logout = async () => {
    // await supabase.auth.signOut();
    clearUserProfile();
    setUser(null);
    userIdRef.current = null;
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
