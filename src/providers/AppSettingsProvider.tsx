import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUserProfile, setUserProfile } from '@/shared/utils/helper';
import type { AppUserSettings } from '@/shared/types/AppUser';
import type { Json } from '@/shared/types/supabase';
import { supabase } from '@/shared/utils/supabaseClient';
import { useAuth } from './AuthProvider';

// Subset of Settings that's relevant natively (darkMode handled by system; no DOM)
export interface AppSettings {
  sound: boolean;
  autoTimer: boolean;
  darkMode: boolean;
  shareProgress: boolean;
  dataCollection: boolean;
  aiProvider: string;
  aiCustomPrompt: string;
  notifications: boolean;
  /** Hour of day (0-23) for the local daily practice reminder. */
  dailyReminderHour: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  sound: true,
  autoTimer: true,
  darkMode: false,
  shareProgress: true,
  dataCollection: false,
  aiProvider: 'chatgpt',
  aiCustomPrompt: '',
  notifications: false,
  dailyReminderHour: 20,
};

interface AppSettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const { isLogin } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(() => {
    const profile = getUserProfile();
    return { ...DEFAULT_SETTINGS, ...(profile?.settings as Partial<AppSettings> ?? {}) };
  });

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Persist to MMKV + Supabase on change (debounced via setTimeout)
  useEffect(() => {
    const profile = getUserProfile();
    if (profile) setUserProfile({ ...profile, settings: settings as unknown as AppUserSettings });

    if (!isLogin) return;
    const timer = setTimeout(() => {
      supabase
        .from('users')
        .update({ settings: settings as unknown as Json })
        .eq('id', profile?.id ?? '')
        .then();
    }, 1500);
    return () => clearTimeout(timer);
  }, [settings, isLogin]);

  return (
    <AppSettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings(): AppSettingsContextType {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider');
  return ctx;
}
