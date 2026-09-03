/**
 * appStorage — file-backed local database for the native app.
 *
 * The PWA uses Dexie/IndexedDB (`src/storage/storageService.ts`). React Native has no
 * IndexedDB, and AsyncStorage caps out well below a full question bank, so the native
 * equivalent stores each "table" as a JSON document under the app's document directory.
 *
 * Reads are cached in memory, writes are deferred to the next tick so a burst of
 * `put` calls collapses into a single file write.
 */
import { Directory, File, Paths } from 'expo-file-system';

const ROOT_NAME = 'gatequest-db';

let rootReady = false;

function root(): Directory {
    const dir = new Directory(Paths.document, ROOT_NAME);
    if (!rootReady) {
        if (!dir.exists) dir.create({ intermediates: true });
        rootReady = true;
    }
    return dir;
}

function fileFor(name: string): File {
    return new File(root(), `${name}.json`);
}

const memory = new Map<string, unknown>();
const dirty = new Set<string>();
let flushScheduled = false;

function flush() {
    flushScheduled = false;
    for (const name of dirty) {
        try {
            fileFor(name).write(JSON.stringify(memory.get(name) ?? null));
        } catch (err) {
            console.warn(`[appStorage] failed to persist "${name}"`, err);
        }
    }
    dirty.clear();
}

function scheduleFlush(name: string) {
    dirty.add(name);
    if (flushScheduled) return;
    flushScheduled = true;
    setTimeout(flush, 0);
}

/** Reads a document, falling back to `fallback` when it is missing or corrupt. */
export function readDoc<T>(name: string, fallback: T): T {
    if (memory.has(name)) return memory.get(name) as T;
    try {
        const file = fileFor(name);
        if (!file.exists) {
            memory.set(name, fallback);
            return fallback;
        }
        const parsed = JSON.parse(file.textSync()) as T;
        memory.set(name, parsed);
        return parsed;
    } catch (err) {
        console.warn(`[appStorage] failed to read "${name}"`, err);
        memory.set(name, fallback);
        return fallback;
    }
}

/** Replaces a document and schedules it for persistence. */
export function writeDoc<T>(name: string, value: T): T {
    memory.set(name, value);
    scheduleFlush(name);
    return value;
}

/** Updates a document in place via a reducer. */
export function updateDoc<T>(name: string, fallback: T, update: (current: T) => T): T {
    return writeDoc(name, update(readDoc(name, fallback)));
}

/** Deletes every document. Used on logout so no user data survives a session. */
export function nukeStorage(): void {
    memory.clear();
    dirty.clear();
    try {
        const dir = root();
        if (dir.exists) dir.delete();
    } catch (err) {
        console.warn('[appStorage] nuke failed', err);
    }
    rootReady = false;
}

/** Persists any pending writes immediately (used before the app backgrounds). */
export function flushStorage(): void {
    if (dirty.size > 0) flush();
}
