import { storage } from '@/shared/utils/storageService';
import type { AppUser } from '@/shared/types/AppUser';

const USER_KEY = 'gate_user_profile';

export function getUserProfile(): AppUser | null {
  return storage.get<AppUser>(USER_KEY);
}

export function setUserProfile(profile: AppUser): void {
  storage.set(USER_KEY, profile);
}

export function clearUserProfile(): void {
  storage.delete(USER_KEY);
}
