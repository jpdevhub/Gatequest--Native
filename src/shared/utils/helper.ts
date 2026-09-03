import { toast } from 'sonner-native';
import { readDoc, writeDoc } from '@/shared/storage/appStorage';
import type { AppUser } from '@/shared/types/AppUser';
import type { Question } from '@/shared/types/storage';
import { storage } from '@/shared/utils/storageService';
import { supabase } from '@/shared/utils/supabaseClient';

const USER_KEY = 'gate_user_profile';

export function getUserProfile(): AppUser | null {
    return storage.get<AppUser>(USER_KEY);
}

export function setUserProfile(profile: AppUser): void {
    storage.set(USER_KEY, profile);
}

export function updateUserProfile(updates: Partial<AppUser>): AppUser | null {
    const current = getUserProfile();
    if (!current) return null;
    const updated = { ...current, ...updates };
    setUserProfile(updated);
    return updated;
}

export function clearUserProfile(): void {
    storage.delete(USER_KEY);
}

// Sorts questions newest-first, matching the PWA's default question ordering.
export const sortQuestionsByYear = (questionsToSort: Question[]) =>
    [...questionsToSort].sort((a, b) => b.year - a.year);

export const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${Math.round(s)}s`;
};

export const normalizeTag = (tag: string): string =>
    decodeURIComponent(tag)
        .toLowerCase()
        .trim()
        .replace(/^(\/tag\/|\/)/, '')
        .split('/')
        .pop() || '';

// Pushes the local profile to Supabase. Native has no separate account page yet,
// so this only carries the fields the native settings screen can change.
export const syncUserToSupabase = async (isLogin: boolean) => {
    if (!isLogin) return;
    const user = getUserProfile();
    if (!user?.id) return;

    const { error } = await supabase
        .from('users')
        .update({
            name: user.name ?? null,
            avatar: user.avatar ?? null,
            college: user.college ?? null,
            targetYear: user.targetYear || null,
            settings: (user.settings ?? {}) as never,
        })
        .eq('id', user.id);

    if (error) {
        console.error('Sync failed', error);
        toast.error('Profile update failed, try again later.');
    }
};

// ---------------------------------------------------------------------------
// Attempt buffering — port of the PWA's localStorage attempt buffer.
// Attempts are written locally first so a failed sync never loses an answer.
// ---------------------------------------------------------------------------

type AttemptParams = {
    user_id: string;
    question_id: string;
    subject: string;
    subject_id: string;
    branch_id: string;
    was_correct: boolean | null;
    time_taken: number;
    attempt_number: number;
    user_version_number: number | undefined;
};

type AttemptBufferItem = AttemptParams & { attempted_at: string };

const bufferDoc = (userId: string) => `attempt_buffer_${userId}`;

export const recordAttemptLocally = async ({
    params,
    user,
    refresh,
}: {
    params: AttemptParams;
    user: AppUser;
    refresh: () => void;
}) => {
    if (!user?.id) {
        toast.error('No valid user profile found.');
        return;
    }

    if (user.id === '1') {
        toast.info('Login to sync your profile.');
        return;
    }

    const key = bufferDoc(user.id);
    const buffer = readDoc<AttemptBufferItem[]>(key, []);
    buffer.push({ ...params, attempted_at: new Date().toISOString() });
    writeDoc(key, buffer);

    const error = await recordAttempt({ buffer, user, refresh });
    if (error) {
        // The buffer is kept so the next attempt retries this one too.
        toast.error('Attempt saved offline — it will sync on your next answer.');
        return;
    }
    writeDoc<AttemptBufferItem[]>(key, []);
};

export const recordAttempt = async ({
    buffer,
    user,
    refresh,
}: {
    buffer: AttemptBufferItem[];
    user: AppUser;
    refresh: () => void;
}) => {
    if (!user?.id || user.id === '1') return;

    if (buffer.length !== 0) {
        const { error } = await supabase.rpc('insert_user_question_activity_batch', {
            batch: buffer as never,
        });

        if (error) {
            console.error('Batch insert error:', error);
            return error;
        }
    }

    refresh();
};

/** Flushes any attempts left over from an offline session. */
export const flushAttemptBuffer = async (user: AppUser, refresh: () => void) => {
    if (!user?.id || user.id === '1') return;
    const key = bufferDoc(user.id);
    const buffer = readDoc<AttemptBufferItem[]>(key, []);
    if (buffer.length === 0) return;

    const error = await recordAttempt({ buffer, user, refresh });
    if (!error) writeDoc<AttemptBufferItem[]>(key, []);
};
