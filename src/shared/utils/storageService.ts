/**
 * storageService.ts
 *
 * Synchronous-looking storage backed by an in-memory cache + AsyncStorage persistence.
 *
 * Why: react-native-mmkv requires a compiled native module (not available in Expo Go).
 * AsyncStorage IS bundled in Expo Go and works without a custom build.
 *
 * Usage:
 *   - Call `storage.hydrate()` once at app startup (in _layout.tsx) before providers render.
 *   - All get/set/delete calls are then synchronous via the in-memory cache.
 *   - AsyncStorage writes happen fire-and-forget in the background for persistence.
 *
 * Production note: When building the final APK (eas build), swap this back to MMKV for
 * better performance. The API surface is identical, so it's a one-file change.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const memCache: Record<string, string> = {};

export const storage = {
  /** Hydrate in-memory cache from AsyncStorage. Call once before rendering providers. */
  async hydrate(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      if (keys.length === 0) return;
      const pairs = await AsyncStorage.multiGet(keys);
      pairs.forEach(([key, value]) => {
        if (value !== null) memCache[key] = value;
      });
    } catch (e) {
      // Non-fatal: app will still work, just without persisted data on this launch
      console.warn('[storage] hydration failed:', e);
    }
  },

  get<T>(key: string): T | null {
    const raw = memCache[key];
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  set(key: string, value: unknown): void {
    const serialized = JSON.stringify(value);
    memCache[key] = serialized;
    // Fire-and-forget persistence
    AsyncStorage.setItem(key, serialized).catch(e =>
      console.warn('[storage] set failed:', e),
    );
  },

  delete(key: string): void {
    delete memCache[key];
    AsyncStorage.removeItem(key).catch(e =>
      console.warn('[storage] delete failed:', e),
    );
  },

  nuke(): void {
    Object.keys(memCache).forEach(k => delete memCache[k]);
    AsyncStorage.clear().catch(e =>
      console.warn('[storage] nuke failed:', e),
    );
  },
};
