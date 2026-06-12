// Mirrors PWA: src/shared/types/AppUser.ts
// Simplified — no supabase.ts dependency needed for the native scaffold.
// Replace with the full supabase generated types once supabase CLI is run.

export interface AppUserSettings {
  sound: boolean;
  autoTimer: boolean;
  darkMode: boolean;
  shareProgress?: boolean;
  dataCollection?: boolean;
  aiProvider?: string;
  aiCustomPrompt?: string;
}

export interface AppUser {
  id: string;
  email?: string | null;
  name?: string | null;
  avatar?: string | null;
  college?: string | null;
  targetYear?: number | null;
  total_xp?: number | null;
  show_name?: boolean | null;
  bookmark_questions?: string[] | null;
  version_number?: number;
  joined_at?: string;
  settings?: AppUserSettings | null;
}
